import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { registerSW } from "./pwa-register";
import {
  ACCOUNT_OWNER_KEY,
  GAME_SAVED_AT_KEY,
  GAME_STORAGE_KEY,
  SYNC_KEYS,
  accountBackupKey,
  accountSyncCacheKey,
  hasSaveData,
  parseBackup,
  readSnapshot,
  resolveSnapshot,
  writeSnapshot,
} from "./cloudSave";

const HoorGame = lazy(() => import("./App"));
const GUEST_KEY = "hoor_guest_mode_v1";
const pendingPushes = new Map<string, Promise<void>>();

function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-center text-white" dir="rtl" role="status" aria-live="polite">
      <span className="text-5xl" aria-hidden="true">🐔</span>
      <span className="text-lg font-bold">جارٍ تجهيز عالم حور…</span>
      <span className="h-2 w-40 overflow-hidden rounded-full bg-slate-700">
        <span className="block h-full w-2/3 animate-pulse rounded-full bg-emerald-400" />
      </span>
    </div>
  );
}

function prepareLocalSaveForAccount(userId: string) {
  const owner = localStorage.getItem(ACCOUNT_OWNER_KEY);
  if (owner && owner !== userId) {
    const current = readSnapshot(localStorage);
    if (hasSaveData(current)) {
      localStorage.setItem(
        accountBackupKey(owner),
        JSON.stringify({
          data: current,
          savedAt: Number(localStorage.getItem(GAME_SAVED_AT_KEY) || 0),
        }),
      );
    }
    for (const key of SYNC_KEYS) localStorage.removeItem(key);
    localStorage.removeItem(GAME_SAVED_AT_KEY);
  }

  if (!hasSaveData(readSnapshot(localStorage))) {
    const backup = parseBackup(localStorage.getItem(accountBackupKey(userId)));
    if (backup) {
      writeSnapshot(localStorage, backup.data);
      if (backup.savedAt) localStorage.setItem(GAME_SAVED_AT_KEY, String(backup.savedAt));
    }
  }
}

function normalizeRemoteSnapshot(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const snapshot: Record<string, string> = {};
  for (const key of SYNC_KEYS) {
    const entry = (value as Record<string, unknown>)[key];
    if (typeof entry === "string") snapshot[key] = entry;
  }
  return snapshot;
}

async function pushSave(userId: string, force = false): Promise<void> {
  const existing = pendingPushes.get(userId);
  if (existing) return existing;

  const task = (async () => {
    if (!navigator.onLine) return;
    const snapshot = readSnapshot(localStorage);
    if (!hasSaveData(snapshot)) return;

    const json = JSON.stringify(snapshot);
    const cacheKey = accountSyncCacheKey(userId);
    if (!force && localStorage.getItem(cacheKey) === json) return;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("game_saves")
      .upsert({ user_id: userId, data: snapshot, updated_at: now });
    if (error) throw error;

    localStorage.setItem(cacheKey, json);
    localStorage.setItem(ACCOUNT_OWNER_KEY, userId);
    localStorage.setItem(GAME_SAVED_AT_KEY, String(Date.parse(now)));
  })();

  pendingPushes.set(userId, task);
  try {
    await task;
  } finally {
    if (pendingPushes.get(userId) === task) pendingPushes.delete(userId);
  }
}

async function pullSave(userId: string, isCurrent: () => boolean = () => true) {
  if (!isCurrent()) return;
  prepareLocalSaveForAccount(userId);

  const { data, error } = await supabase
    .from("game_saves")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!isCurrent()) return;

  const local = readSnapshot(localStorage);
  const remote = normalizeRemoteSnapshot(data?.data);
  const localSavedAt = Number(localStorage.getItem(GAME_SAVED_AT_KEY) || 0);
  const remoteUpdatedAt = data?.updated_at ? Date.parse(data.updated_at) : 0;
  const selected = resolveSnapshot(local, remote, localSavedAt, remoteUpdatedAt);

  if (!isCurrent()) return;
  writeSnapshot(localStorage, selected);
  if (hasSaveData(selected)) localStorage.setItem(ACCOUNT_OWNER_KEY, userId);
  if (remoteUpdatedAt && selected[GAME_STORAGE_KEY] === remote[GAME_STORAGE_KEY]) {
    localStorage.setItem(GAME_SAVED_AT_KEY, String(remoteUpdatedAt));
  }

  const selectedJson = JSON.stringify(selected);
  const remoteJson = JSON.stringify(remote);
  if (hasSaveData(selected) && (!data || selectedJson !== remoteJson)) {
    // A matching local cache is not proof the remote row still exists or is current.
    // Force the repair upload whenever the fetched remote snapshot differs.
    if (!isCurrent()) return;
    await pushSave(userId, true);
  } else {
    localStorage.setItem(accountSyncCacheKey(userId), selectedJson);
  }
}

export default function CloudGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [ready, setReady] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const syncReadyRef = useRef(false);

  useEffect(() => {
    registerSW({ immediate: true });
    setGuest(localStorage.getItem(GUEST_KEY) === "1");
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(false);
      setSyncReady(false);
      syncReadyRef.current = false;
    });

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        setSession(data.session);
      })
      .catch(() => setErr("تعذّر التحقق من جلسة الدخول. تحقق من اتصالك ثم أعد تحميل الصفحة."))
      .finally(() => setChecked(true));

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setReady(false);
      setSyncReady(false);
      syncReadyRef.current = false;
      return;
    }

    let cancelled = false;
    let syncing = false;
    let retryTimer = 0;
    let saveTimer = 0;
    const userId = session.user.id;
    syncReadyRef.current = false;
    setReady(false);
    setSyncReady(false);

    const sync = async () => {
      if (cancelled || syncing) return;
      if (!navigator.onLine) {
        setReady(true);
        return;
      }
      syncing = true;
      try {
        await pullSave(userId, () => !cancelled && session?.user.id === userId);
        if (!cancelled) {
          syncReadyRef.current = true;
          setSyncReady(true);
          setErr("");
        }
      } catch {
        if (!cancelled) setErr("تعذّر مزامنة التقدم الآن. سيظل حفظك المحلي متاحاً وسنحاول مجدداً.");
      } finally {
        syncing = false;
        if (!cancelled) setReady(true);
      }
    };

    const push = async () => {
      if (cancelled || !syncReadyRef.current || !navigator.onLine) return;
      try {
        await pushSave(userId);
      } catch {
        if (!cancelled) setErr("تعذّر رفع آخر تقدم إلى السحابة. سيُعاد المحاولة تلقائياً.");
      }
    };

    void sync();
    retryTimer = window.setInterval(() => {
      if (!cancelled) {
        if (!syncReadyRef.current) void sync();
        else void push();
      }
    }, 15000);

    const onHide = () => {
      if (document.visibilityState === "hidden") void push();
    };
    const onOnline = () => {
      if (!syncReadyRef.current) void sync();
      else void push();
    };
    const onStorage = (event: StorageEvent) => {
      if (
        syncReadyRef.current &&
        (event.key === GAME_STORAGE_KEY || event.key === GAME_SAVED_AT_KEY)
      ) {
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => void push(), 400);
      }
    };

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", push);
    window.addEventListener("online", onOnline);
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      syncReadyRef.current = false;
      window.clearInterval(retryTimer);
      window.clearTimeout(saveTimer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", push);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("storage", onStorage);
    };
  }, [session]);

  const signIn = useCallback(async () => {
    setErr("");
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setErr(navigator.onLine ? "تعذّر تسجيل الدخول، حاول مرة أخرى." : "تحتاج اتصالاً بالإنترنت لتسجيل الدخول.");
        setBusy(false);
      }
    } catch {
      setErr("تعذّر بدء تسجيل الدخول. حاول مرة أخرى.");
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      if (session && syncReadyRef.current) await pushSave(session.user.id);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setReady(false);
      setSyncReady(false);
      syncReadyRef.current = false;
    } catch {
      setErr("تعذّر تسجيل الخروج بأمان. تحقق من الاتصال وحاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }, [session]);

  function playAsGuest() {
    localStorage.setItem(GUEST_KEY, "1");
    setGuest(true);
  }

  if (!checked) return <Loading />;

  if (session && ready) {
    return (
      <>
        <Suspense fallback={<Loading />}>
          <HoorGame />
        </Suspense>
        {!syncReady && (
          <div className="fixed top-3 right-3 z-50 max-w-xs rounded-xl border border-amber-300/50 bg-slate-950/90 px-3 py-2 text-xs font-bold text-amber-100 shadow" role="status">
            حفظ محلي مؤقت — جارٍ انتظار اتصال آمن للمزامنة
          </div>
        )}
        <button
          onClick={signOut}
          disabled={busy}
          className="fixed bottom-20 left-2 z-50 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow disabled:opacity-60 sm:bottom-2"
        >
          {busy ? "جارٍ الحفظ…" : "خروج (" + (session.user.email?.split("@")[0] || "الحساب") + ")"}
        </button>
        {err && <div className="fixed bottom-2 right-2 z-50 max-w-xs rounded-xl bg-rose-950/95 px-3 py-2 text-xs font-bold text-white shadow" role="alert">{err}</div>}
      </>
    );
  }
  if (session) return <Loading />;

  if (guest) {
    return (
      <>
        <Suspense fallback={<Loading />}>
          <HoorGame />
        </Suspense>
        <button
          onClick={() => {
            localStorage.removeItem(GUEST_KEY);
            setGuest(false);
          }}
          className="fixed bottom-20 left-2 z-50 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-sky-700 shadow sm:bottom-2"
        >
          حفظ التقدم بحساب Google
        </button>
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-sky-50 p-5" dir="rtl">
      <div className="w-full max-w-sm rounded-3xl border-4 border-amber-300 bg-white p-8 text-center shadow-xl">
        <div className="mb-3 text-6xl animate-float" aria-hidden="true">🐔</div>
        <h1 className="text-3xl font-black text-sky-700">حور تلعب و تتعلم</h1>
        <p className="mt-3 text-slate-600">
          سجّل الدخول بحساب Google ليُحفظ تقدم أطفالك ويعمل على أي جهاز.
        </p>
        <button
          onClick={signIn}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-600 px-4 py-3 text-lg font-bold text-white shadow disabled:opacity-60"
        >
          <span className="rounded-full bg-white px-2 font-english text-sky-600" aria-hidden="true">G</span>
          {busy ? "جارٍ فتح تسجيل الدخول…" : "الدخول بحساب Google"}
        </button>
        {err && <p className="mt-3 text-sm font-bold text-red-600" role="alert">{err}</p>}
        <button onClick={playAsGuest} className="mt-4 text-sm font-bold text-slate-500 underline">
          العب بدون حساب (يُحفظ على هذا الجهاز فقط)
        </button>
        <p className="mt-6 text-xs text-slate-400">🔒 نستخدم بريدك فقط لحفظ التقدم.</p>
      </div>
    </div>
  );
}
