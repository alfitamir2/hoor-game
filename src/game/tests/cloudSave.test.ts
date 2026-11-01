import { describe, expect, it } from "vitest";
import {
  ACCOUNT_OWNER_KEY,
  GAME_SAVED_AT_KEY,
  GAME_STORAGE_KEY,
  accountBackupKey,
  accountSyncCacheKey,
  hasSaveData,
  parseBackup,
  readSnapshot,
  resolveSnapshot,
  writeSnapshot,
} from "../cloudSave";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

describe("cloud save storage", () => {
  it("includes the production game's real localStorage key", () => {
    const storage = memoryStorage({ [GAME_STORAGE_KEY]: '{"stars":20}' });
    expect(readSnapshot(storage)).toEqual({ [GAME_STORAGE_KEY]: '{"stars":20}' });
  });

  it("restores a complete snapshot and removes stale legacy keys", () => {
    const storage = memoryStorage({
      [GAME_STORAGE_KEY]: "old",
      "hoor_game_progress_v2": "legacy",
    });
    writeSnapshot(storage, { [GAME_STORAGE_KEY]: "new" });
    expect(storage.getItem(GAME_STORAGE_KEY)).toBe("new");
    expect(storage.getItem("hoor_game_progress_v2")).toBeNull();
  });

  it("keeps a local guest save when the cloud account has no game save", () => {
    const local = { [GAME_STORAGE_KEY]: '{"stars":50}' };
    expect(resolveSnapshot(local, {}, 100, 0)).toEqual(local);
  });

  it("restores the newer cloud save instead of overwriting it with stale local data", () => {
    const local = { [GAME_STORAGE_KEY]: '{"stars":20}' };
    const remote = { [GAME_STORAGE_KEY]: '{"stars":80}' };
    expect(resolveSnapshot(local, remote, 100, 200)).toEqual(remote);
  });

  it("uploads a newer local save after offline play", () => {
    const local = { [GAME_STORAGE_KEY]: '{"stars":80}' };
    const remote = { [GAME_STORAGE_KEY]: '{"stars":20}' };
    expect(resolveSnapshot(local, remote, 300, 200)).toEqual(local);
  });

  it("preserves legacy remote fields while keeping the newer local game save", () => {
    const local = { [GAME_STORAGE_KEY]: '{"stars":80}' };
    const remote = { "hoor_game_progress_v2": '{"level":4}' };
    expect(resolveSnapshot(local, remote, 300, 200)).toEqual({
      [GAME_STORAGE_KEY]: '{"stars":80}',
      "hoor_game_progress_v2": '{"level":4}',
    });
  });

  it("scopes account backup and push-cache keys to the authenticated user", () => {
    expect(accountBackupKey("user-a")).not.toBe(accountBackupKey("user-b"));
    expect(accountSyncCacheKey("user-a")).not.toBe(accountSyncCacheKey("user-b"));
    expect(ACCOUNT_OWNER_KEY).toBe("hoor_game_owner_v1");
    expect(GAME_SAVED_AT_KEY).toBe("hoor_game_saved_at_v1");
  });

  it("validates backup data and rejects malformed backups", () => {
    expect(parseBackup('{"data":{"hoor_game_architect_v3":"{}"},"savedAt":12}')).toEqual({
      data: { [GAME_STORAGE_KEY]: "{}" },
      savedAt: 12,
    });
    expect(parseBackup("not-json")).toBeNull();
    expect(hasSaveData({})).toBe(false);
  });
});
