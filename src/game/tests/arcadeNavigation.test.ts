import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const html = readFileSync("public/Hoor-Plays-Learns-Android.html", "utf8");
const start = html.indexOf("    function switchMainView(");
const end = html.indexOf("    function renderStagesMap(", start);
const switchView = new Function("viewKey", "gameActive", `${html.slice(start, end)}
  switchMainView(viewKey);
  return gameActive;
`);

describe("Arcade navigation", () => {
  beforeEach(() => {
    document.body.innerHTML = html.slice(html.indexOf("<body"), html.indexOf("  <script>", html.indexOf("<body")));
    localStorage.clear();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  });

  it("pauses the game and remembers the selected section", () => {
    expect(switchView("map", true)).toBe(false);
    expect(localStorage.getItem("hoor_last_view_v1")).toBe("map");
    expect(switchView("play", false)).toBe(false);
  });

  it("leaves the current game state unchanged for an unknown section", () => {
    expect(switchView("missing", true)).toBe(true);
    expect(localStorage.getItem("hoor_last_view_v1")).toBeNull();
  });
});