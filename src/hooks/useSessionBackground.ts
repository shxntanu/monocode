import { useEffect, useState, useSyncExternalStore } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  loadSessionBackground,
  loadSessionBackgroundImage,
  loadSessionBackgroundPersist,
  loadSessionBackgroundEmptyOpacity,
  loadSessionBackgroundChatOpacity,
  SESSION_BACKGROUND_DEFAULT,
  SESSION_BACKGROUND_EMPTY_OPACITY_DEFAULT,
  SESSION_BACKGROUND_OPACITY_DEFAULT,
  subscribeSessionBackground,
  type SessionBackground,
} from "../lib/settings";

export function useSessionBackground(): SessionBackground {
  return useSyncExternalStore(
    subscribeSessionBackground,
    loadSessionBackground,
    () => SESSION_BACKGROUND_DEFAULT,
  );
}

export function useSessionBackgroundImage(): string | null {
  return useSyncExternalStore(
    subscribeSessionBackground,
    loadSessionBackgroundImage,
    () => null,
  );
}

export function useSessionBackgroundPersist(): boolean {
  return useSyncExternalStore(
    subscribeSessionBackground,
    loadSessionBackgroundPersist,
    () => false,
  );
}

export function useSessionBackgroundOpacity(): number {
  return useSessionBackgroundChatOpacity();
}

export function useSessionBackgroundEmptyOpacity(): number {
  return useSyncExternalStore(
    subscribeSessionBackground,
    loadSessionBackgroundEmptyOpacity,
    () => SESSION_BACKGROUND_EMPTY_OPACITY_DEFAULT,
  );
}

export function useSessionBackgroundChatOpacity(): number {
  return useSyncExternalStore(
    subscribeSessionBackground,
    loadSessionBackgroundChatOpacity,
    () => SESSION_BACKGROUND_OPACITY_DEFAULT,
  );
}

/** Whether the composer should use elevated contrast for the current layout. */
export function useComposerBackgroundElevated(shell: boolean): string | undefined {
  const sessionBackground = useSessionBackground();
  const sessionBackgroundPersist = useSessionBackgroundPersist();
  const sessionBackgroundImage = useSessionBackgroundImage();
  const backgroundVisible =
    sessionBackground !== "none" && (shell || sessionBackgroundPersist);
  const sessionImageContrast = useSessionImageContrast(
    backgroundVisible && sessionBackground === "image"
      ? sessionBackgroundImage
      : null,
  );

  if (!backgroundVisible) return undefined;
  if (sessionBackground === "image") {
    return sessionImageContrast ? `image-${sessionImageContrast}` : "image";
  }
  return sessionBackground;
}

/** Whether the composer region sits on a bright or dark part of the wallpaper. */
export type SessionImageContrast = "light" | "dark";

/**
 * Samples the lower-center band of a wallpaper — where the empty-session
 * composer sits — so we can pick a panel color that stays readable.
 */
export function useSessionImageContrast(
  imagePath: string | null,
): SessionImageContrast | null {
  const [contrast, setContrast] = useState<SessionImageContrast | null>(null);

  useEffect(() => {
    if (!imagePath) {
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
    img.src = convertFileSrc(imagePath);

    return () => {
      cancelled = true;
    };
  }, [imagePath]);

  return contrast;
}
