import { isAgentTool } from "./harness/preview";
import type { Block, HarnessId, Session, SubagentTranscript } from "./session";

export type SubagentSummary = {
  callId: string;
  title: string;
  busy: boolean;
};

/** Nested subagent drill-down is Codex-only until other harnesses capture transcripts. */
export function harnessSupportsSubagentViews(harness: HarnessId): boolean {
  return harness === "codex";
}

function subagentToolRunning(status: string): boolean {
  return (
    status === "in_progress" || status === "pending" || status === "running"
  );
}

export function hasOpenableSubagent(block: Block): boolean {
  if (block.role !== "tool" || !block.tool?.callId) return false;
  const title = block.text || block.tool.title || "";
  if (!isAgentTool(block.tool.kind, title)) return false;
  const status = block.tool.status ?? "";
  const transcript = block.tool.subagent;
  return (
    subagentToolRunning(status) || (transcript?.blocks.length ?? 0) > 0
  );
}

export function listSubagentSummaries(session: Session): SubagentSummary[] {
  if (!harnessSupportsSubagentViews(session.harness)) return [];
  const rows: SubagentSummary[] = [];
  for (const block of session.blocks) {
    if (block.role !== "tool" || !block.tool?.callId) continue;
    const title = block.text || block.tool.title || "Subagent";
    const kind = block.tool.kind;
    if (!isAgentTool(kind, title)) continue;
    const transcript = block.tool.subagent;
    const status = block.tool.status ?? "";
    const running =
      subagentToolRunning(status) ||
      (transcript?.blocks.some((block) => block.streaming) ?? false);
    if (!transcript?.blocks.length && !running) continue;
    rows.push({
      callId: block.tool.callId,
      title,
      busy: running,
    });
  }
  return rows;
}

export function subagentBlocks(
  session: Session,
  callId: string,
): Block[] | undefined {
  return findSubagentToolBlock(session, callId)?.tool?.subagent?.blocks;
}

export function subagentTitle(session: Session, callId: string): string {
  const block = findSubagentToolBlock(session, callId);
  return block?.text || block?.tool?.title || "Subagent";
}

export function findSubagentToolBlock(
  session: Session,
  callId: string,
): Block | undefined {
  return session.blocks.find((block) => block.tool?.callId === callId);
}

export function ensureSubagentTranscript(
  block: Block,
  agentThreadId?: string,
): SubagentTranscript {
  const existing = block.tool?.subagent;
  return {
    agentThreadId: agentThreadId ?? existing?.agentThreadId,
    blocks: existing?.blocks ?? [],
  };
}

export function patchSubagentTranscript(
  session: Session,
  callId: string,
  transcript: SubagentTranscript,
): Session {
  const index = session.blocks.findIndex(
    (block) => block.tool?.callId === callId,
  );
  if (index < 0) return session;
  const block = session.blocks[index];
  if (!block.tool) return session;
  const blocks = session.blocks.slice();
  blocks[index] = {
    ...block,
    tool: {
      ...block.tool,
      subagent: transcript,
    },
  };
  return { ...session, blocks };
}
