import { lazy, Suspense, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const HoorGame = lazy(() => import("./App"));

const SYNC_KEYS = [
  "hoor_game_settings_v2",
  "hoor_game_progress_v2",
  "hoor_has_selected_age_v2",
  "hoor_child_profiles_v1",
  "hoor_active_child_profile_v1",
];
const GUEST_KEY = "hoor_guest_mode_v1";
const SYNC_AT_KEY = "hoor_cloud_synced_at_v1";

function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of SYNC_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  }
  return out;
}

async function pullSave(userId: string) {
  const { data, error } = await supabase
    .from("game_saves")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return;
  const remoteAt = new Date(data.updated_at).getTime();
  const localAt = Number(localStorage.getItem(SYNC_AT_KEY) || 0);
  if (remoteAt <= localAt) return;
  const saved = (data.data ?? {}) as Record<string, string>;
  for (const k of SYNC_KEYS) {
    if (typeof saved[k] === "string") localStorage.setItem(k, saved[k]);
  }
  localStorage.setItem(SYNC_AT_KEY, String(remoteAt));
}

let lastPushed = "";
async function pushSave(userId: string) {
  if (!navigator.onLine) return;
  const snap = snapshot();
  const json = JSON.stringify(snap);
  if (json === lastPushed) return;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("game_saves")
    .upsert({ user_id: userId, data: snap, updated_at: now });
  if (!error) {
    lastPushed = json;
    localStorage.setItem(SYNC_AT_KEY, String(new Date(now).getTime()));
  }
}

function Loading() {
  return <div className="flex min-h-screen items-center justify-center text-2xl font-bold">...</div>;
}

export default function CloudGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [ready, setReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setGuest(localStorage.getItem(GUEST_KEY) === "1");
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load cloud progress once signed in, then start the game.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const uid = session.user.id;
    (navigator.onLine ? pullSave(uid) : Promise.resolve())
      .catch(() => {})
      .finally(() => !cancelled && setReady(true));
    const timer = window.setInterval(() => void pushSave(uid), 20000);
    const onHide = () => document.visibilityState === "hidden" && void pushSave(uid);
    const onOnline = () => void pushSave(uid);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onOnline);
    };
  }, [session]);

  async function signIn() {
    setErr("");
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErr(navigator.onLine ? "تعذّر تسجيل الدخول، حاول مرة أخرى." : "تحتاج اتصالاً بالإنترنت لتسجيل الدخول.");
      setBusy(false);
    }
  }

  async function signOut() {
    if (session) await pushSave(session.user.id).catch(() => {});
    await supabase.auth.signOut();
    setReady(false);
  }

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
        <button
          onClick={signOut}
          className="fixed bottom-2 left-2 z-50 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-600 shadow"
        >
          خروج ({session.user.email?.split("@")[0]})
        </button>
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
          className="fixed bottom-2 left-2 z-50 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-sky-700 shadow"
        >
          حفظ التقدم بحساب Google
        </button>
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-sky-50 p-5">
      <div className="w-full max-w-sm rounded-3xl border-4 border-amber-300 bg-white p-8 text-center shadow-xl">
        <div className="mb-3 text-6xl animate-float">🐔</div>
        <h1 className="text-3xl font-black text-sky-700">حور تلعب و تتعلم</h1>
        <p className="mt-3 text-slate-600">
          سجّل الدخول بحساب Google ليُحفظ تقدم أطفالك ويعمل على أي جهاز.
        </p>
        <button
          onClick={signIn}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-600 px-4 py-3 text-lg font-bold text-white shadow disabled:opacity-60"
        >
          <span className="rounded-full bg-white px-2 font-english text-sky-600">G</span>
          الدخول بحساب Google
        </button>
        {err && <p className="mt-3 text-sm font-bold text-red-600">{err}</p>}
        <button onClick={playAsGuest} className="mt-4 text-sm font-bold text-slate-500 underline">
          العب بدون حساب (يُحفظ على هذا الجهاز فقط)
        </button>
        <p className="mt-6 text-xs text-slate-400">🔒 نستخدم بريدك فقط لحفظ التقدم.</p>
      </div>
    </div>
  );
}
