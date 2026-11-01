export const GAME_STORAGE_KEY = "hoor_game_architect_v3";
export const LEGACY_SYNC_KEYS = [
  "hoor_game_settings_v2",
  "hoor_game_progress_v2",
  "hoor_has_selected_age_v2",
  "hoor_child_profiles_v1",
  "hoor_active_child_profile_v1",
  "hoor_quiz_attempts_v1",
] as const;
export const SYNC_KEYS = [GAME_STORAGE_KEY, ...LEGACY_SYNC_KEYS] as const;
export const ACCOUNT_OWNER_KEY = "hoor_game_owner_v1";
export const GAME_SAVED_AT_KEY = "hoor_game_saved_at_v1";

export type SaveSnapshot = Record<string, string>;
type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem" | "removeItem">;

export function accountBackupKey(userId: string): string {
  return "hoor_game_account_backup_v1:" + userId;
}

export function accountSyncCacheKey(userId: string): string {
  return "hoor_cloud_last_pushed_v2:" + userId;
}

export function readSnapshot(storage: StorageReader): SaveSnapshot {
  const snapshot: SaveSnapshot = {};
  for (const key of SYNC_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) snapshot[key] = value;
  }
  return snapshot;
}

export function writeSnapshot(storage: StorageWriter, snapshot: SaveSnapshot): void {
  for (const key of SYNC_KEYS) {
    const value = snapshot[key];
    if (typeof value === "string") storage.setItem(key, value);
    else storage.removeItem(key);
  }
}

export function hasSaveData(snapshot: SaveSnapshot): boolean {
  return SYNC_KEYS.some((key) => typeof snapshot[key] === "string");
}

/** Select a complete save by timestamp; never merge consumable balances. */
export function resolveSnapshot(
  local: SaveSnapshot,
  remote: SaveSnapshot,
  localSavedAt: number,
  remoteUpdatedAt: number,
): SaveSnapshot {
  const localHasGame = typeof local[GAME_STORAGE_KEY] === "string";
  const remoteHasGame = typeof remote[GAME_STORAGE_KEY] === "string";

  let preferLocal = false;
  if (localHasGame && !remoteHasGame) preferLocal = true;
  else if (!localHasGame && remoteHasGame) preferLocal = false;
  else if (localHasGame && remoteHasGame) preferLocal = localSavedAt > remoteUpdatedAt;
  else if (Object.keys(local).length && !Object.keys(remote).length) preferLocal = true;
  else preferLocal = localSavedAt > remoteUpdatedAt;

  return preferLocal ? { ...remote, ...local } : { ...local, ...remote };
}

export function parseBackup(value: string | null): { data: SaveSnapshot; savedAt: number } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { data?: unknown; savedAt?: unknown };
    if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) return null;
    const data: SaveSnapshot = {};
    for (const [key, entry] of Object.entries(parsed.data)) {
      if ((SYNC_KEYS as readonly string[]).includes(key) && typeof entry === "string") data[key] = entry;
    }
    return { data, savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0 };
  } catch {
    return null;
  }
}


/** Skip only when the local snapshot is known to match the desired upload. */
export function shouldSkipPush(cachedJson: string | null, snapshotJson: string, force = false): boolean {
  return !force && cachedJson === snapshotJson;
}
