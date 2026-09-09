import { describe, expect, it } from "vitest";
import { applyHarnessEvent } from "./harness/apply";
import { newSession } from "./session";
import {
  harnessSupportsSubagentViews,
  hasOpenableSubagent,
  listSubagentSummaries,
  subagentBlocks,
} from "./subagents";

describe("harnessSupportsSubagentViews", () => {
  it("is enabled for Codex only", () => {
    expect(harnessSupportsSubagentViews("codex")).toBe(true);
    expect(harnessSupportsSubagentViews("claude")).toBe(false);
    expect(harnessSupportsSubagentViews("cursor")).toBe(false);
  });
});

describe("listSubagentSummaries", () => {
  it("returns nothing for non-Codex harnesses", () => {
    let session = newSession("claude", "/repo");
    session = applyHarnessEvent(session, {
      type: "tool.started",
      callId: "sa_1",
      title: "Explore subagent",
      kind: "agent",
      status: "in_progress",
    });
    expect(listSubagentSummaries(session)).toEqual([]);
  });
  it("lists running codex subagents with nested blocks", () => {
    let session = newSession("codex", "/repo");
    session = applyHarnessEvent(session, {
      type: "tool.started",
      callId: "sa_1",
      title: "Explore Auth subagent",
      kind: "agent",
      status: "in_progress",
      agentThreadId: "thr_child",
    });
    session = applyHarnessEvent(session, {
      type: "message.delta",
      text: "Checking routes",
      subagentCallId: "sa_1",
    });
    expect(listSubagentSummaries(session)).toEqual([
      {
        callId: "sa_1",
        title: "Explore Auth subagent",
        busy: true,
      },
    ]);
    expect(subagentBlocks(session, "sa_1")).toEqual([
      expect.objectContaining({
        role: "assistant",
        text: "Checking routes",
      }),
    ]);
    const tool = session.blocks.find((block) => block.tool?.callId === "sa_1");
    expect(tool && hasOpenableSubagent(tool)).toBe(true);
  });
});
