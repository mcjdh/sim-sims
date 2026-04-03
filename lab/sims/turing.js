export const name = "turing";

// gray-scott reaction-diffusion
const DU = 0.2;              // U diffusion rate (substrate — fast)
const DV = 0.1;              // V diffusion rate (catalyst — slow)
const STEPS_PER_FRAME = 8;   // sub-steps per render (PDE stability)
const DT = 1.0;              // time step
const MOUSE_RADIUS = 5;      // seed radius
const DRIFT_SPEED = 0.00003; // how fast params traverse pattern space

// interesting parameter path through Gray-Scott space
// each point: [feed, kill] — the sim drifts between these
const PARAM_PATH = [
  [0.037, 0.060],  // coral / mitosis
  [0.030, 0.062],  // spots
  [0.042, 0.065],  // worms / stripes
  [0.025, 0.060],  // expanding waves
  [0.034, 0.063],  // maze-like
  [0.039, 0.058],  // pulsing blobs
];

export function init() {
  const gw = 240, gh = 120;
  const u = Array.from({ length: gh }, () => { const a = new Float32Array(gw); a.fill(1); return a; });
  const v = Array.from({ length: gh }, () => new Float32Array(gw));
  const lu = Array.from({ length: gh }, () => new Float32Array(gw));
  const lv = Array.from({ length: gh }, () => new Float32Array(gw));

  // seed V in a few random clusters
  for (let s = 0; s < 12; s++) {
    const cx = Math.floor(Math.random() * gw);
    const cy = Math.floor(Math.random() * gh);
    const r = 3 + Math.floor(Math.random() * 4);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = ((cx + dx) % gw + gw) % gw;
          const y = ((cy + dy) % gh + gh) % gh;
          u[y][x] = 0.5 + Math.random() * 0.1;
          v[y][x] = 0.25 + Math.random() * 0.1;
        }
      }
  }

  return { u, v, lu, lv, gw, gh, lastT: -1, pathPos: 0 };
}

function laplacian(field, out, gw, gh) {
  for (let y = 0; y < gh; y++) {
    const ym = ((y - 1) % gh + gh) % gh;
    const yp = (y + 1) % gh;
    for (let x = 0; x < gw; x++) {
      const xm = ((x - 1) % gw + gw) % gw;
      const xp = (x + 1) % gw;
      // weighted 2D laplacian kernel
      out[y][x] =
        field[ym][xm] * 0.05 + field[ym][x] * 0.2 + field[ym][xp] * 0.05 +
        field[y][xm]  * 0.2  - field[y][x]         + field[y][xp]  * 0.2  +
        field[yp][xm] * 0.05 + field[yp][x] * 0.2 + field[yp][xp] * 0.05;
    }
  }
}

function lerpParam(pathPos) {
  const len = PARAM_PATH.length;
  const i = Math.floor(pathPos) % len;
  const j = (i + 1) % len;
  const t = pathPos - Math.floor(pathPos);
  // smooth interpolation
  const s = t * t * (3 - 2 * t);
  return [
    PARAM_PATH[i][0] * (1 - s) + PARAM_PATH[j][0] * s,
    PARAM_PATH[i][1] * (1 - s) + PARAM_PATH[j][1] * s,
  ];
}

function step(s, mx, my, ar) {
  const { u, v, lu, lv, gw, gh } = s;

  // drift through parameter space
  s.pathPos += DRIFT_SPEED;
  const [f, k] = lerpParam(s.pathPos);

  // mouse seeds catalyst
  const cx = Math.floor(((mx + 1) / 2) * gw);
  const cy = Math.floor(((my + 1) / 2) * gh);
  const mr2 = MOUSE_RADIUS * MOUSE_RADIUS;
  const rx = Math.ceil(MOUSE_RADIUS / ar);
  for (let dy = -MOUSE_RADIUS; dy <= MOUSE_RADIUS; dy++) {
    const dy2 = dy * dy;
    if (dy2 >= mr2) continue;
    const fy = ((cy + dy) % gh + gh) % gh;
    for (let dx = -rx; dx <= rx; dx++) {
      const adx = dx * ar;
      const d2 = adx * adx + dy2;
      if (d2 < mr2) {
        const fx = ((cx + dx) % gw + gw) % gw;
        v[fy][fx] = Math.min(1, v[fy][fx] + 0.15 / (1 + d2));
      }
    }
  }

  for (let step = 0; step < STEPS_PER_FRAME; step++) {
    laplacian(u, lu, gw, gh);
    laplacian(v, lv, gw, gh);

    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++) {
        const uv = u[y][x];
        const vv = v[y][x];
        const uvv = uv * vv * vv;
        u[y][x] = uv + (DU * lu[y][x] - uvv + f * (1 - uv)) * DT;
        v[y][x] = vv + (DV * lv[y][x] + uvv - (f + k) * vv) * DT;
      }
  }
}

export function sim(x, y, t, W, H, mx, my, state, AR) {
  if (t !== state.lastT) {
    step(state, mx, my, AR);
    state.lastT = t;
  }
  // V concentration = visual intensity
  return state.v[y][x] * 3;
}
