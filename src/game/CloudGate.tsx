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
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-[#071b1a] text-center text-[#f5f0e2]" dir="rtl" role="status" aria-live="polite">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 35%, rgba(57,168,137,.2), transparent 42%), radial-gradient(ellipse at 80% 85%, rgba(216,184,117,.1), transparent 34%)" }} />
      <span className="relative flex h-24 w-24 items-center justify-center rounded-[1.8rem] border border-[#d8b875]/40 bg-[linear-gradient(145deg,#286e58,#102f29)] text-6xl shadow-[0_16px_40px_rgba(0,0,0,.35)]" aria-hidden="true">🐔</span>
      <span className="relative text-lg font-extrabold text-[#fff5df]">جارٍ تجهيز عالم حور…</span>
      <span className="relative h-2 w-44 overflow-hidden rounded-full bg-[#24483d]">
        <span className="block h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#39a889] to-[#d8b875]" />
      </span>
      <span className="relative text-xs text-[#9eb6a7]">لحظات ونبدأ المغامرة</span>
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

async function pushSave(userId: string): Promise<void> {
  const existing = pendingPushes.get(userId);
  if (existing) return existing;

  const task = (async () => {
    if (!navigator.onLine) return;
    const snapshot = readSnapshot(localStorage);
    if (!hasSaveData(snapshot)) return;

    const json = JSON.stringify(snapshot);
    const cacheKey = accountSyncCacheKey(userId);
    if (localStorage.getItem(cacheKey) === json) return;

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

async function pullSave(userId: string) {
  prepareLocalSaveForAccount(userId);

  const { data, error } = await supabase
    .from("game_saves")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const local = readSnapshot(localStorage);
  const remote = normalizeRemoteSnapshot(data?.data);
  const localSavedAt = Number(localStorage.getItem(GAME_SAVED_AT_KEY) || 0);
  const remoteUpdatedAt = data?.updated_at ? Date.parse(data.updated_at) : 0;
  const selected = resolveSnapshot(local, remote, localSavedAt, remoteUpdatedAt);

  writeSnapshot(localStorage, selected);
  if (hasSaveData(selected)) localStorage.setItem(ACCOUNT_OWNER_KEY, userId);
  if (remoteUpdatedAt && selected[GAME_STORAGE_KEY] === remote[GAME_STORAGE_KEY]) {
    localStorage.setItem(GAME_SAVED_AT_KEY, String(remoteUpdatedAt));
  }

  const selectedJson = JSON.stringify(selected);
  const remoteJson = JSON.stringify(remote);
  if (hasSaveData(selected) && (!data || selectedJson !== remoteJson)) {
    await pushSave(userId);
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

    let active = true;
    let timedOut = false;
    const sessionTimeout = window.setTimeout(() => {
      timedOut = true;
      if (active) {
        setErr("استغرق الاتصال وقتاً أطول من المعتاد. يمكنك اللعب كضيف الآن أو إعادة تحميل الصفحة.");
        setChecked(true);
      }
    }, 8000);

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active && !timedOut) setSession(data.session);
      })
      .catch(() => {
        if (active && !timedOut) {
          setErr("تعذّر التحقق من جلسة الدخول. يمكنك اللعب كضيف أو المحاولة مجدداً.");
        }
      })
      .finally(() => {
        window.clearTimeout(sessionTimeout);
        if (active) setChecked(true);
      });

    return () => {
      active = false;
      window.clearTimeout(sessionTimeout);
    };

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
        await pullSave(userId);
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
          className="fixed bottom-20 left-2 z-50 rounded-full border border-[#d8b875]/35 bg-[#102f29]/95 px-4 py-2.5 text-xs font-extrabold text-[#f0dfb6] shadow-lg backdrop-blur sm:bottom-2 disabled:opacity-60"
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
          className="fixed bottom-20 left-2 z-50 rounded-full border border-[#d8b875]/35 bg-[#102f29]/95 px-4 py-2.5 text-xs font-extrabold text-[#f0dfb6] shadow-lg backdrop-blur sm:bottom-2"
        >
          حفظ التقدم بحساب Google
        </button>
      </>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071b1a] px-4 py-8 text-[#f5f0e2] sm:px-6" dir="rtl">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(ellipse at 18% 12%, rgba(57,168,137,.22), transparent 38%), radial-gradient(ellipse at 88% 82%, rgba(216,184,117,.14), transparent 36%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(30deg, transparent 48%, #d8b875 49%, #d8b875 50%, transparent 51%), linear-gradient(150deg, transparent 48%, #69c6a8 49%, #69c6a8 50%, transparent 51%)", backgroundSize: "44px 76px" }} />
      <section className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#d8b875]/35 bg-[linear-gradient(150deg,rgba(17,55,46,.98),rgba(7,29,28,.99))] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,.48)] sm:p-9">
        <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#e7ce96] to-transparent" />
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#69c6a8]/25 bg-[#39a889]/10 px-4 py-2 text-xs font-extrabold text-[#bfe8d4]">
          <span aria-hidden="true">✦</span>
          بيئة آمنة للأطفال واليافعين — بلا إعلانات
          <span aria-hidden="true">✦</span>
        </div>
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[1.8rem] border border-[#d8b875]/45 bg-[linear-gradient(145deg,#286e58,#102f29)] text-6xl shadow-[0_12px_32px_rgba(0,0,0,.3)]" aria-hidden="true">🐔</div>
        <p className="mb-2 text-xs font-extrabold tracking-[.18em] text-[#d8b875]">عَالَمٌ مِنَ اللَّعِبِ وَالتَّعَلُّمِ</p>
        <h1 className="text-3xl font-black leading-tight text-[#fff5df] sm:text-4xl">حور تلعب وتتعلم</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-8 text-[#c4d5ca]">
          سجّل الدخول بحساب Google ليُحفظ تقدم أطفالك ويعمل على أي جهاز.
        </p>
        <button
          onClick={signIn}
          disabled={busy}
          className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#9bd8bb]/25 bg-[linear-gradient(135deg,#287c62,#1b604f)] px-4 py-3 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-[#246b55]" aria-hidden="true">G</span>
          {busy ? "جارٍ فتح تسجيل الدخول…" : "الدخول بحساب Google"}
        </button>
        {err && <p className="mt-4 rounded-xl border border-rose-300/25 bg-rose-950/50 px-3 py-2 text-sm font-bold leading-6 text-rose-200" role="alert">{err}</p>}
        <div className="my-5 flex items-center gap-3 text-[#8da99a]">
          <span className="h-px flex-1 bg-[#b8c9bd]/15" />
          <span className="text-xs">أو</span>
          <span className="h-px flex-1 bg-[#b8c9bd]/15" />
        </div>
        <button onClick={playAsGuest} className="min-h-12 w-full rounded-xl border border-[#d8b875]/25 bg-[#071b1a]/45 px-4 py-3 text-sm font-extrabold text-[#f0dfb6] transition hover:border-[#d8b875]/55 hover:bg-[#071b1a]/75">
          العب بدون حساب
          <span className="mt-1 block text-xs font-medium text-[#a9bdb0]">يُحفظ تقدمك على هذا الجهاز فقط</span>
        </button>
        <p className="mt-6 text-xs leading-6 text-[#91a99a]">🔒 نستخدم بريدك فقط لحفظ التقدم.</p>
      </section>
    </main>
  );
}
