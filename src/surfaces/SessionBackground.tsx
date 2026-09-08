import { useSyncExternalStore } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  loadSessionBackground,
  loadSessionBackgroundImage,
  SESSION_BACKGROUND_DEFAULT,
  subscribeSessionBackground,
} from "../lib/settings";
import { TerminalGridBackground } from "./TerminalGridBackground";

type Props = {
  /** When false, arcade falls back to the static grid (for chat transcripts). */
  interactive?: boolean;
};

export function SessionBackground({ interactive = true }: Props) {
  const background = useSyncExternalStore(
    subscribeSessionBackground,
    loadSessionBackground,
    () => SESSION_BACKGROUND_DEFAULT,
  );
  const imagePath = useSyncExternalStore(
    subscribeSessionBackground,
    loadSessionBackgroundImage,
    () => null,
  );

  if (background === "none") return null;

  if (background === "grid") {
    return (
      <div
        aria-hidden
        className="session-background-root pointer-events-none absolute inset-0 z-0"
      >
        <div className="session-grid-bg absolute inset-0" />
      </div>
    );
  }

  if (background === "arcade") {
    return (
      <div
        aria-hidden
        className="session-background-root pointer-events-none absolute inset-0 z-0"
      >
        {interactive ? (
          <TerminalGridBackground />
        ) : (
          <div className="session-grid-bg absolute inset-0" />
        )}
      </div>
    );
  }

  if (background === "image" && imagePath) {
    return (
      <div
        aria-hidden
        className="session-background-root pointer-events-none absolute inset-0 z-0"
      >
        <div
          className="session-bg-image-layer absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${convertFileSrc(imagePath)})` }}
        />
        <div className="session-bg-image-vignette absolute inset-0" />
        <div className="session-bg-image-overlay absolute inset-0" />
      </div>
    );
  }

  return null;
}
