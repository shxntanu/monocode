import type { CSSProperties } from "react";
import "./CodexEffortEffects.css";

export type CodexEffortTone =
  "low" | "medium" | "high" | "xhigh" | "max" | "ultra";

const CODEX_EFFORT_TONES: readonly string[] = [
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "ultra",
];

export function isCodexEffortTone(value: string): value is CodexEffortTone {
  return CODEX_EFFORT_TONES.includes(value);
}

export function CodexEffortEffect({ tone }: { tone: CodexEffortTone }) {
  if (tone === "low") return <GlideEffect />;
  if (tone === "medium") return <ScopeEffect />;
  if (tone === "high") return <SynapseEffect />;
  if (tone === "xhigh") return <WarpEffect />;
  return <TileShimmer />;
}

const TILE_COLUMNS = 32;
const TILE_ROWS = 5;

function TileShimmer() {
  return (
    <span className="codex-effort-fx codex-effort-tiles" aria-hidden="true">
      {Array.from({ length: TILE_COLUMNS * TILE_ROWS }, (_, index) => {
        const column = index % TILE_COLUMNS;
        const row = Math.floor(index / TILE_COLUMNS);
        const centerColumn = (TILE_COLUMNS - 1) / 2;
        const centerRow = (TILE_ROWS - 1) / 2;
        const distance = Math.hypot(
          (column - centerColumn) / centerColumn,
          (row - centerRow) / centerRow,
        );
        const filled = (index * 73 + index * index * 19 + 23) % 101 < 65;
        return (
          <span
            key={index}
            className={`codex-effort-tile${filled ? " codex-effort-tile--filled" : ""}`}
            style={{ "--tile-distance": distance } as CSSProperties}
          />
        );
      })}
    </span>
  );
}

// Effort rows are 202×32px (the 210px setting menu minus its padding), so the
// SVG effects draw in real pixels and keep circles round under
// preserveAspectRatio="none".
const FX_WIDTH = 202;
const FX_HEIGHT = 32;
const FX_VIEW_BOX = `0 0 ${FX_WIDTH} ${FX_HEIGHT}`;

type Point = readonly [number, number];

function tracePath(points: Point[]): string {
  return points
    .map(
      ([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(2)}`,
    )
    .join("");
}

function samples(from: number, to: number, step: number): number[] {
  return Array.from({ length: Math.ceil((to - from) / step) + 1 }, (_, i) =>
    Math.min(from + i * step, to),
  );
}

const FX_RADIUS = 8;

function rowOutlinePath(inset: number): string {
  const r = FX_RADIUS - inset;
  const right = FX_WIDTH - inset;
  const bottom = FX_HEIGHT - inset;
  const arc = (x: number, y: number) => `A${r} ${r} 0 0 1 ${x} ${y}`;
  return [
    `M${inset + r} ${inset}`,
    `H${right - r}`,
    arc(right, inset + r),
    `V${bottom - r}`,
    arc(right - r, bottom),
    `H${inset + r}`,
    arc(inset, bottom - r),
    `V${inset + r}`,
    arc(inset + r, inset),
    "Z",
  ].join("");
}

const GLIDE_Y = 26;
const GLIDE_START = 8;
const GLIDE_END = FX_WIDTH - 8;

function GlideEffect() {
  return (
    <span
      className="codex-effort-fx codex-effort-glide"
      aria-hidden="true"
      style={
        { "--glide-distance": `${GLIDE_END - GLIDE_START}px` } as CSSProperties
      }
    >
      <span className="codex-effort-glide-sheen" />
      <svg viewBox={FX_VIEW_BOX} preserveAspectRatio="none">
        <path
          className="codex-effort-glide-line"
          d={`M${GLIDE_START} ${GLIDE_Y}H${GLIDE_END}`}
          pathLength={1}
        />
        <circle
          className="codex-effort-glide-dot"
          cx={GLIDE_START}
          cy={GLIDE_Y}
          r={1.6}
        />
      </svg>
    </span>
  );
}

const SCOPE_MID = FX_HEIGHT / 2;
const SCOPE_WAVELENGTH = 34;
const SCOPE_TAPER = 28;
const SCOPE_SIGNAL_AMPLITUDE = 8;
const SCOPE_ECHO_AMPLITUDE = 4.5;
const SCOPE_ECHO_PHASE = Math.PI / 2;

function scopeTaper(x: number): number {
  return Math.max(
    0,
    Math.min(1, x / SCOPE_TAPER, (FX_WIDTH - x) / SCOPE_TAPER),
  );
}

function scopeWave(x: number, amplitude: number, phase = 0): number {
  return (
    SCOPE_MID -
    amplitude * Math.sin((2 * Math.PI * x) / SCOPE_WAVELENGTH + phase)
  );
}

const SCOPE_NOISE_PATH = tracePath(
  samples(0, FX_WIDTH, 3).map((x, i) => {
    const jitter = ((i * 73 + i * i * 19 + 23) % 101) / 50 - 1;
    return [x, SCOPE_MID + (3 * Math.sin(x / 7) + 6 * jitter) * scopeTaper(x)];
  }),
);

const SCOPE_SIGNAL_PATH = tracePath(
  samples(0, FX_WIDTH, 1).map((x) => [
    x,
    scopeWave(x, SCOPE_SIGNAL_AMPLITUDE * scopeTaper(x)),
  ]),
);

const SCOPE_ECHO_PATH = tracePath(
  samples(0, FX_WIDTH, 1)
    .reverse()
    .map((x) => [
      x,
      scopeWave(x, SCOPE_ECHO_AMPLITUDE * scopeTaper(x), SCOPE_ECHO_PHASE),
    ]),
);

const SCOPE_LIVE_SAMPLES = samples(
  -SCOPE_WAVELENGTH * 2,
  FX_WIDTH + SCOPE_WAVELENGTH * 2,
  1,
);

const SCOPE_SIGNAL_LIVE_PATH = tracePath(
  SCOPE_LIVE_SAMPLES.map((x) => [x, scopeWave(x, SCOPE_SIGNAL_AMPLITUDE)]),
);

const SCOPE_ECHO_LIVE_PATH = tracePath(
  SCOPE_LIVE_SAMPLES.map((x) => [
    x,
    scopeWave(x, SCOPE_ECHO_AMPLITUDE, SCOPE_ECHO_PHASE),
  ]),
);

function ScopeEffect() {
  return (
    <span className="codex-effort-fx codex-effort-scope" aria-hidden="true">
      <span className="codex-effort-scope-grid" />
      <span className="codex-effort-scope-beam" />
      <svg viewBox={FX_VIEW_BOX} preserveAspectRatio="none">
        <path
          className="codex-effort-scope-noise"
          d={SCOPE_NOISE_PATH}
          pathLength={1}
        />
        <path
          className="codex-effort-scope-head codex-effort-scope-head--noise"
          d={SCOPE_NOISE_PATH}
          pathLength={1}
        />
        <path
          className="codex-effort-scope-echo"
          d={SCOPE_ECHO_PATH}
          pathLength={1}
        />
        <path
          className="codex-effort-scope-signal"
          d={SCOPE_SIGNAL_PATH}
          pathLength={1}
        />
        <path
          className="codex-effort-scope-head codex-effort-scope-head--signal"
          d={SCOPE_SIGNAL_PATH}
          pathLength={1}
        />
      </svg>
      <span className="codex-effort-scope-live">
        <svg viewBox={FX_VIEW_BOX} preserveAspectRatio="none">
          <path
            className="codex-effort-scope-echo-live"
            d={SCOPE_ECHO_LIVE_PATH}
          />
          <path
            className="codex-effort-scope-signal-live"
            d={SCOPE_SIGNAL_LIVE_PATH}
          />
        </svg>
      </span>
    </span>
  );
}

const SYNAPSE_LAYERS = [
  [16],
  [8, 24],
  [14],
  [7, 23],
  [17],
  [8, 25],
  [15],
  [7, 24],
  [16],
];
const SYNAPSE_INSET = 12;
const SYNAPSE_LAST_LAYER = SYNAPSE_LAYERS.length - 1;

type SynapseNode = { x: number; y: number; layer: number };

const SYNAPSE_NODES: SynapseNode[] = SYNAPSE_LAYERS.flatMap((ys, layer) =>
  ys.map((y) => ({
    x:
      SYNAPSE_INSET +
      (layer * (FX_WIDTH - SYNAPSE_INSET * 2)) / SYNAPSE_LAST_LAYER,
    y,
    layer,
  })),
);

const SYNAPSE_EDGES = SYNAPSE_NODES.flatMap((from) =>
  SYNAPSE_NODES.filter(
    (to) =>
      to.layer === from.layer + 1 ||
      (to.layer === from.layer + 2 &&
        SYNAPSE_LAYERS[from.layer].length > 1 &&
        Math.abs(to.y - from.y) <= 2),
  ).map((to) => ({
    d: `M${from.x.toFixed(2)} ${from.y}L${to.x.toFixed(2)} ${to.y}`,
    style: {
      "--layer": from.layer,
      "--span": to.layer - from.layer,
      "--reverse": SYNAPSE_LAST_LAYER - to.layer,
    } as CSSProperties,
  })),
);

const SYNAPSE_ORBIT_PATH = rowOutlinePath(0.75);

const SYNAPSE_ORBIT_TRAILS = [
  { name: "tail", dash: 0.16 },
  { name: "body", dash: 0.07 },
  { name: "head", dash: 0.018 },
];

function SynapseEffect() {
  return (
    <span className="codex-effort-fx codex-effort-synapse" aria-hidden="true">
      <svg viewBox={FX_VIEW_BOX} preserveAspectRatio="none">
        <g className="codex-effort-synapse-edges">
          {SYNAPSE_EDGES.map((edge, index) => (
            <path
              key={index}
              className="codex-effort-synapse-edge"
              d={edge.d}
              pathLength={1}
              style={edge.style}
            />
          ))}
        </g>
        <g>
          {SYNAPSE_EDGES.map((edge, index) => (
            <path
              key={index}
              className="codex-effort-synapse-pulse codex-effort-synapse-pulse--forward"
              d={edge.d}
              pathLength={1}
              style={edge.style}
            />
          ))}
          {SYNAPSE_EDGES.map((edge, index) => (
            <path
              key={index}
              className="codex-effort-synapse-pulse codex-effort-synapse-pulse--backward"
              d={edge.d}
              pathLength={1}
              style={edge.style}
            />
          ))}
        </g>
        <g className="codex-effort-synapse-nodes">
          {SYNAPSE_NODES.map((node, index) => (
            <g
              key={index}
              style={
                {
                  "--layer": node.layer,
                  "--reverse": SYNAPSE_LAST_LAYER - node.layer,
                  "--spread":
                    Math.abs(node.x - FX_WIDTH / 2) /
                    (FX_WIDTH / 2 - SYNAPSE_INSET),
                } as CSSProperties
              }
            >
              <circle
                className="codex-effort-synapse-flare"
                cx={node.x}
                cy={node.y}
                r={4}
              />
              <circle
                className="codex-effort-synapse-ring codex-effort-synapse-ring--forward"
                cx={node.x}
                cy={node.y}
                r={2.4}
              />
              <circle
                className="codex-effort-synapse-ring codex-effort-synapse-ring--backward"
                cx={node.x}
                cy={node.y}
                r={2.4}
              />
              <circle
                className="codex-effort-synapse-core"
                cx={node.x}
                cy={node.y}
                r={1.5}
              />
            </g>
          ))}
        </g>
        {SYNAPSE_ORBIT_TRAILS.map((trail) => (
          <path
            key={trail.name}
            className={`codex-effort-synapse-orbit codex-effort-synapse-orbit--${trail.name}`}
            d={SYNAPSE_ORBIT_PATH}
            pathLength={1}
            style={{ "--dash": trail.dash } as CSSProperties}
          />
        ))}
      </svg>
    </span>
  );
}

const WARP_CENTER_X = FX_WIDTH / 2;
const WARP_CENTER_Y = FX_HEIGHT / 2;
const WARP_STREAK_COUNT = 36;
const WARP_RING_COUNT = 6;
const WARP_STAR_COUNT = 14;
const WARP_WAVES = [
  { start: 200, duration: 1100, count: 2 },
  { start: 1000, duration: 750, count: 2 },
  { start: 1700, duration: 480, count: 3 },
];
const WARP_OUTLINE_PATH = rowOutlinePath(0.5);

function warpJitter(index: number): number {
  return ((index * 37 + 11) % 17) / 17;
}

const WARP_STREAKS = Array.from({ length: WARP_STREAK_COUNT }, (_, index) => {
  const jitter = warpJitter(index);
  const angle = ((index + jitter * 0.6) / WARP_STREAK_COUNT) * Math.PI * 2;
  const point = (radius: number) =>
    `${(WARP_CENTER_X + Math.cos(angle) * radius * WARP_CENTER_X).toFixed(2)} ${(
      WARP_CENTER_Y +
      Math.sin(angle) * radius * WARP_CENTER_Y
    ).toFixed(2)}`;
  const wave = index % WARP_WAVES.length;
  const { start, duration, count } = WARP_WAVES[wave];
  return {
    d: `M${point(0.12)}L${point(1.45)}`,
    wave,
    style: {
      "--delay": `${Math.round(start + jitter * 350)}ms`,
      "--duration": `${duration}ms`,
      "--count": count,
    } as CSSProperties,
  };
});

const WARP_STARS = Array.from({ length: WARP_STAR_COUNT }, (_, index) => {
  const x = 6 + (((index * 53 + 17) % 97) / 97) * (FX_WIDTH - 12);
  const y = 3 + (((index * 29 + 5) % 23) / 23) * (FX_HEIGHT - 6);
  return {
    x,
    y,
    style: {
      "--delay": `${3250 + ((index * 7) % 5) * 60}ms`,
      "--dx": `${(((x - WARP_CENTER_X) / WARP_CENTER_X) * 18).toFixed(1)}px`,
      "--dy": `${(((y - WARP_CENTER_Y) / WARP_CENTER_Y) * 4).toFixed(1)}px`,
    } as CSSProperties,
  };
});

function WarpEffect() {
  return (
    <span className="codex-effort-fx codex-effort-warp" aria-hidden="true">
      <span className="codex-effort-warp-core" />
      <span className="codex-effort-warp-flash" />
      <svg viewBox={FX_VIEW_BOX} preserveAspectRatio="none">
        {Array.from({ length: WARP_RING_COUNT }, (_, index) => (
          <path
            key={index}
            className="codex-effort-warp-ring"
            d={WARP_OUTLINE_PATH}
            style={{ "--ring": index } as CSSProperties}
          />
        ))}
        {WARP_STREAKS.map((streak, index) => (
          <path
            key={index}
            className={`codex-effort-warp-streak codex-effort-warp-streak--${streak.wave}`}
            d={streak.d}
            pathLength={1}
            style={streak.style}
          />
        ))}
        <path className="codex-effort-warp-shock" d={WARP_OUTLINE_PATH} />
        {WARP_STARS.map((star, index) => (
          <circle
            key={index}
            className="codex-effort-warp-star"
            cx={star.x}
            cy={star.y}
            r={0.8}
            style={star.style}
          />
        ))}
      </svg>
    </span>
  );
}
