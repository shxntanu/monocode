import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  COMPOSER_RUNNER_DEFAULT,
  DIFF_VIEWER_DEFAULT,
  FOLLOW_UP_BEHAVIOR_DEFAULT,
  KEYBINDINGS,
  LIVE_AGENTS_ENABLED_DEFAULT,
  loadComposerRunner,
  loadDiffViewer,
  loadFollowUpBehavior,
  loadLiveAgentsEnabled,
  loadNotesEnabled,
  loadSessionBackground,
  loadSessionBackgroundImage,
  loadSessionBackgroundEmptyOpacity,
  loadSessionBackgroundChatOpacity,
  loadSessionBackgroundPersist,
  NOTES_ENABLED_DEFAULT,
  saveComposerRunner,
  saveDiffViewer,
  saveFollowUpBehavior,
  saveLiveAgentsEnabled,
  saveNotesEnabled,
  saveSessionBackground,
  saveSessionBackgroundImage,
  saveSessionBackgroundEmptyOpacity,
  saveSessionBackgroundChatOpacity,
  saveSessionBackgroundPersist,
  sessionBackgroundVisible,
  SESSION_BACKGROUND_DEFAULT,
  SESSION_BACKGROUND_EMPTY_OPACITY_DEFAULT,
  SESSION_BACKGROUND_OPACITY_DEFAULT,
  SESSION_BACKGROUND_PERSIST_DEFAULT,
} from "./settings";

const KEY = "monocode.composerRunner";
const NOTES_KEY = "monocode.notesEnabled";
const LIVE_AGENTS_KEY = "monocode.liveAgentsEnabled";
const SESSION_BACKGROUND_KEY = "monocode.sessionBackground";
const SESSION_BACKGROUND_IMAGE_KEY = "monocode.sessionBackgroundImage";
const SESSION_BACKGROUND_PERSIST_KEY = "monocode.sessionBackgroundPersist";
const SESSION_BACKGROUND_OPACITY_KEY = "monocode.sessionBackgroundOpacity";
const SESSION_BACKGROUND_EMPTY_OPACITY_KEY =
  "monocode.sessionBackgroundEmptyOpacity";
const GRID_ARCADE_KEY = "monocode.gridArcadeEnabled";
const DIFF_VIEWER_KEY = "monocode.diffViewer";
const FOLLOW_UP_BEHAVIOR_KEY = "monocode.followUpBehavior";

describe("follow-up behavior setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(FOLLOW_UP_BEHAVIOR_KEY);
  });

  it("defaults to steer", () => {
    expect(FOLLOW_UP_BEHAVIOR_DEFAULT).toBe("steer");
    expect(loadFollowUpBehavior()).toBe("steer");
  });

  it("persists queue behavior", () => {
    saveFollowUpBehavior("queue");
    expect(loadFollowUpBehavior()).toBe("queue");
  });

  it("ignores unknown stored values", () => {
    localStorage.setItem(FOLLOW_UP_BEHAVIOR_KEY, "interrupt");
    expect(loadFollowUpBehavior()).toBe("steer");
  });
});

function mockLocalStorage() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
}

describe("composer runner setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(KEY);
  });

  it("defaults to on", () => {
    expect(COMPOSER_RUNNER_DEFAULT).toBe(true);
    expect(loadComposerRunner()).toBe(true);
  });

  it("persists an off switch", () => {
    saveComposerRunner(false);
    expect(localStorage.getItem(KEY)).toBe("0");
    expect(loadComposerRunner()).toBe(false);
    saveComposerRunner(true);
    expect(loadComposerRunner()).toBe(true);
  });
});

describe("notes enabled setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(NOTES_KEY);
  });

  it("defaults to on", () => {
    expect(NOTES_ENABLED_DEFAULT).toBe(true);
    expect(loadNotesEnabled()).toBe(true);
  });

  it("persists an off switch", () => {
    saveNotesEnabled(false);
    expect(localStorage.getItem(NOTES_KEY)).toBe("0");
    expect(loadNotesEnabled()).toBe(false);
    saveNotesEnabled(true);
    expect(loadNotesEnabled()).toBe(true);
  });
});

describe("live agents enabled setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(LIVE_AGENTS_KEY);
  });

  it("defaults to on", () => {
    expect(LIVE_AGENTS_ENABLED_DEFAULT).toBe(true);
    expect(loadLiveAgentsEnabled()).toBe(true);
  });

  it("persists an off switch", () => {
    saveLiveAgentsEnabled(false);
    expect(localStorage.getItem(LIVE_AGENTS_KEY)).toBe("0");
    expect(loadLiveAgentsEnabled()).toBe(false);
    saveLiveAgentsEnabled(true);
    expect(loadLiveAgentsEnabled()).toBe(true);
  });
});

describe("session background setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(SESSION_BACKGROUND_KEY);
    localStorage.removeItem(SESSION_BACKGROUND_IMAGE_KEY);
    localStorage.removeItem(SESSION_BACKGROUND_PERSIST_KEY);
    localStorage.removeItem(SESSION_BACKGROUND_OPACITY_KEY);
    localStorage.removeItem(SESSION_BACKGROUND_EMPTY_OPACITY_KEY);
    localStorage.removeItem(GRID_ARCADE_KEY);
  });

  it("defaults to arcade", () => {
    expect(SESSION_BACKGROUND_DEFAULT).toBe("arcade");
    expect(loadSessionBackground()).toBe("arcade");
  });

  it("persists each background mode", () => {
    saveSessionBackground("none");
    expect(localStorage.getItem(SESSION_BACKGROUND_KEY)).toBe("none");
    expect(loadSessionBackground()).toBe("none");
    saveSessionBackground("grid");
    expect(loadSessionBackground()).toBe("grid");
    saveSessionBackground("image");
    expect(loadSessionBackground()).toBe("image");
  });

  it("migrates the legacy empty-session games toggle", () => {
    localStorage.setItem(GRID_ARCADE_KEY, "0");
    expect(loadSessionBackground()).toBe("none");
    localStorage.setItem(GRID_ARCADE_KEY, "1");
    expect(loadSessionBackground()).toBe("arcade");
  });

  it("persists a custom image path", () => {
    saveSessionBackgroundImage("/tmp/wallpaper.png");
    expect(loadSessionBackgroundImage()).toBe("/tmp/wallpaper.png");
    saveSessionBackgroundImage(null);
    expect(loadSessionBackgroundImage()).toBeNull();
  });

  it("defaults persist to off and both intensities to full", () => {
    expect(SESSION_BACKGROUND_PERSIST_DEFAULT).toBe(false);
    expect(SESSION_BACKGROUND_OPACITY_DEFAULT).toBe(100);
    expect(SESSION_BACKGROUND_EMPTY_OPACITY_DEFAULT).toBe(100);
    expect(loadSessionBackgroundPersist()).toBe(false);
    expect(loadSessionBackgroundEmptyOpacity()).toBe(100);
    expect(loadSessionBackgroundChatOpacity()).toBe(100);
  });

  it("persists prompt and chat intensities separately", () => {
    saveSessionBackgroundPersist(true);
    expect(loadSessionBackgroundPersist()).toBe(true);
    saveSessionBackgroundEmptyOpacity(85);
    saveSessionBackgroundChatOpacity(45);
    expect(localStorage.getItem(SESSION_BACKGROUND_EMPTY_OPACITY_KEY)).toBe(
      "85",
    );
    expect(localStorage.getItem(SESSION_BACKGROUND_OPACITY_KEY)).toBe("45");
    expect(loadSessionBackgroundEmptyOpacity()).toBe(85);
    expect(loadSessionBackgroundChatOpacity()).toBe(45);
  });

  it("decides when a session pane should show the background", () => {
    expect(sessionBackgroundVisible("none", true, true)).toBe(false);
    expect(sessionBackgroundVisible("grid", false, true)).toBe(true);
    expect(sessionBackgroundVisible("grid", false, false)).toBe(false);
    expect(sessionBackgroundVisible("image", true, false)).toBe(true);
  });
});

describe("workspace navigation keybindings", () => {
  it("documents session and project cycling in the shortcut list", () => {
    const rows = KEYBINDINGS.filter(
      (row) =>
        row.command.startsWith("Session:") ||
        row.command.startsWith("Project:"),
    );
    expect(rows.map((row) => row.command)).toEqual([
      "Session: Previous",
      "Session: Next",
      "Project: Previous",
      "Project: Next",
    ]);
    expect(
      rows.every(
        (row) => row.when === "!overlay && (!textFocus || emptyComposer)",
      ),
    ).toBe(true);
  });
});

describe("diff viewer setting", () => {
  beforeEach(mockLocalStorage);
  afterEach(() => {
    localStorage.removeItem(DIFF_VIEWER_KEY);
  });

  it("defaults to the editor layout", () => {
    expect(DIFF_VIEWER_DEFAULT).toBe("editor");
    expect(loadDiffViewer()).toBe("editor");
  });

  it("persists the unified layout", () => {
    saveDiffViewer("unified");
    expect(localStorage.getItem(DIFF_VIEWER_KEY)).toBe("unified");
    expect(loadDiffViewer()).toBe("unified");
    saveDiffViewer("editor");
    expect(loadDiffViewer()).toBe("editor");
  });

  it("ignores unknown stored values", () => {
    localStorage.setItem(DIFF_VIEWER_KEY, "split");
    expect(loadDiffViewer()).toBe("editor");
  });
});
