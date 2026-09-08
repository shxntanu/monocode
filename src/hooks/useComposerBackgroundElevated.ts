import { useEffect, useState, useSyncExternalStore } from "react";
import {
  chatBackgroundSrc,
  loadChatBackgroundPath,
  loadChatBackgroundScope,
  subscribeChatBackgroundPath,
  type ChatBackgroundScope,
} from "../lib/appearance";
import { projectChatBackgroundSrc } from "../lib/chatBackground";
import { projectKey } from "../lib/paths";
import {
  loadProjectChatBackground,
  projectChatBackgroundRevision,
  subscribeProjectChatBackground,
} from "../lib/projectChatBackground";

type ActiveChatBackground = {
  path: string;
  scope: ChatBackgroundScope;
  src: string;
};

function subscribeChatBackground(onStoreChange: () => void) {
  const cleanups = [
    subscribeChatBackgroundPath(onStoreChange),
    subscribeProjectChatBackground(onStoreChange),
  ];
  return () => cleanups.forEach((cleanup) => cleanup());
}

function resolveActiveChatBackground(cwd: string): ActiveChatBackground | null {
  const project = loadProjectChatBackground(projectKey(cwd));
  if (project?.path) {
    return {
      path: project.path,
      scope: project.scope,
      src: projectChatBackgroundSrc(
        project.path,
        projectChatBackgroundRevision(),
      ),
    };
  }
  const globalPath = loadChatBackgroundPath();
  if (!globalPath) return null;
  const src = chatBackgroundSrc(globalPath);
  if (!src) return null;
  return {
    path: globalPath,
    scope: loadChatBackgroundScope(),
    src,
  };
}

function chatBackgroundVisibleForComposer(
  sessionEmpty: boolean,
  background: ActiveChatBackground | null,
): background is ActiveChatBackground {
  if (!background) return false;
  if (sessionEmpty) return true;
  return background.scope === "all";
}

function chatBackgroundStoreSnapshot(): string {
  return `${loadChatBackgroundPath() ?? ""}|${loadChatBackgroundScope()}|${projectChatBackgroundRevision()}`;
}

/** Whether the composer region sits on a bright or dark part of the wallpaper. */
export type ChatBackgroundContrast = "light" | "dark";

function useChatBackgroundContrast(
  imageSrc: string | null,
): ChatBackgroundContrast | null {
  const [contrast, setContrast] = useState<ChatBackgroundContrast | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setContrast(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      const w = 48;
      const h = 32;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const sx = img.width * 0.08;
      const sy = img.height * 0.52;
      const sw = img.width * 0.84;
      const sh = img.height * 0.42;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

      const data = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      const avg = sum / (data.length / 4) / 255;
      setContrast(avg > 0.5 ? "light" : "dark");
    };
    img.onerror = () => {
      if (!cancelled) setContrast("light");
    };
    img.src = imageSrc;

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  return contrast;
}

/** Frosted composer + picker contrast when a chat background is visible. */
export function useComposerBackgroundElevated(
  cwd: string,
  sessionEmpty: boolean,
): string | undefined {
  const backgroundRevision = useSyncExternalStore(
    subscribeChatBackground,
    chatBackgroundStoreSnapshot,
    chatBackgroundStoreSnapshot,
  );
  void backgroundRevision;

  const background = resolveActiveChatBackground(cwd);
  const visible = chatBackgroundVisibleForComposer(sessionEmpty, background);
  const contrast = useChatBackgroundContrast(
    visible ? background.src : null,
  );

  if (!visible) return undefined;
  return contrast ? `image-${contrast}` : "image";
}
