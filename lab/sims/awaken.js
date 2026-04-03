export const name = "awaken";

// mathematical constants as structural elements — not decoration
const PHI = (1 + Math.sqrt(5)) / 2;    // golden ratio — maximum irrationality
const TAU = Math.PI * 2;
const E = Math.E;

// 4 phase fields at golden-ratio frequency spacing
// φ is the "most irrational" number — these frequencies never sync, maximum non-repetition
const BASE_FREQ = 0.015;
const FREQS = [
  BASE_FREQ,                  // fundamental
  BASE_FREQ * PHI,            // φ harmonic
  BASE_FREQ * PHI * PHI,      // φ² harmonic
  BASE_FREQ * Math.PI / E,    // π/e harmonic (transcendental ratio)
];

// each field diffuses at a different rate — creates spatial separation
const DIFF = [0.15, 0.09, 0.18, 0.06];

// kuramoto coupling — drives spontaneous synchronization between fields
const COUPLE = 0.025;

// memory — the palimpsest
const MEM_BLEND = 1 / (PHI * 1000);          // ~0.000618 — φ-derived
const MEM_DECAY = 1 - 1 / (E * 1000);        // ~0.999632 — e-derived

// 7 wandering attractors with mathematically grounded paths
const NUM_FIELDS = 4;
const ATTRACTORS = [];
for (let i = 0; i < 7; i++) {
  // frequency ratios ensure no two attractors trace the same path
  ATTRACTORS.push({
    fx: PHI / (30 + i * 7),
    fy: E / (25 + i * 11),
    px: i * TAU / PHI,        // golden angle spacing
    py: i * TAU / E,
  });
}

export function init() {
  const gw = 240, gh = 120;

  // 4 phase fields — each cell has a phase angle per field
  const fields = [];
  for (let f = 0; f < NUM_FIELDS; f++) {
    const grid = Array.from({ length: gh }, () => new Float32Array(gw));
    // seed with gentle spatial variation
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++)
        grid[y][x] = Math.random() * TAU;
    fields.push(grid);
  }

  const mem = Array.from({ length: gh }, () => new Float32Array(gw));
  const tmp = Array.from({ length: gh }, () => new Float32Array(gw));

  return { fields, mem, tmp, gw, gh, lastT: -1, t: 0 };
}

function diffusePhase(field, tmp, gw, gh, rate) {
  // phase diffusion — average neighbor phases using circular mean
  for (let y = 0; y < gh; y++) {
    const ym = ((y - 1) % gh + gh) % gh;
    const yp = (y + 1) % gh;
    for (let x = 0; x < gw; x++) {
      const xm = ((x - 1) % gw + gw) % gw;
      const xp = (x + 1) % gw;
      // circular mean via sin/cos averaging of neighbors
      let sx = 0, sy = 0;
      sx += Math.cos(field[ym][x]); sy += Math.sin(field[ym][x]);
      sx += Math.cos(field[yp][x]); sy += Math.sin(field[yp][x]);
      sx += Math.cos(field[y][xm]); sy += Math.sin(field[y][xm]);
      sx += Math.cos(field[y][xp]); sy += Math.sin(field[y][xp]);
      // target angle from neighbors
      const neighborAngle = Math.atan2(sy, sx);
      // pull toward neighbor consensus
      let diff = neighborAngle - field[y][x];
      // wrap to [-π, π]
      if (diff > Math.PI) diff -= TAU;
      if (diff < -Math.PI) diff += TAU;
      tmp[y][x] = diff * rate;
    }
  }
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++)
      field[y][x] = (field[y][x] + tmp[y][x]) % TAU;
}

function step(s, mx, my, ar) {
  const { fields, mem, tmp, gw, gh } = s;
  s.t++;

  // attractor stimulation field
  const stim = Array.from({ length: gh }, () => new Float32Array(gw));
  const time = s.t * 0.001;

  for (const att of ATTRACTORS) {
    const ax = ((Math.sin(time * att.fx + att.px) * 0.42 + 0.5) * gw) | 0;
    const ay = ((Math.sin(time * att.fy + att.py) * 0.42 + 0.5) * gh) | 0;
    const r = 5, r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
      const dy2 = dy * dy;
      if (dy2 >= r2) continue;
      const fy = ((ay + dy) % gh + gh) % gh;
      for (let dx = -r; dx <= r; dx++) {
        const d2 = dx * dx + dy2;
        if (d2 < r2) {
          const fx = ((ax + dx) % gw + gw) % gw;
          stim[fy][fx] += 0.08 / (1 + d2 * 0.5);
        }
      }
    }
  }

  // mouse — gentle presence, not explosion
  const cx = ((mx + 1) / 2 * gw) | 0;
  const cy = ((my + 1) / 2 * gh) | 0;
  const mr = 6, mr2 = mr * mr;
  const rx = Math.ceil(mr / ar);
  for (let dy = -mr; dy <= mr; dy++) {
    const dy2 = dy * dy;
    if (dy2 >= mr2) continue;
    const fy = ((cy + dy) % gh + gh) % gh;
    for (let dx = -rx; dx <= rx; dx++) {
      const adx = dx * ar;
      const d2 = adx * adx + dy2;
      if (d2 < mr2) {
        const fx = ((cx + dx) % gw + gw) % gw;
        stim[fy][fx] += 0.12 / (1 + d2 * 0.3);
      }
    }
  }

  // evolve each phase field
  for (let f = 0; f < NUM_FIELDS; f++) {
    const field = fields[f];

    // phase diffusion — spatial coherence
    diffusePhase(field, tmp, gw, gh, DIFF[f]);

    // phase evolution: base frequency + coupling + stimulation
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++) {
        // base oscillation
        let dphase = FREQS[f];

        // kuramoto coupling — pull toward other fields' phases
        for (let g = 0; g < NUM_FIELDS; g++) {
          if (g === f) continue;
          let diff = fields[g][y][x] - field[y][x];
          if (diff > Math.PI) diff -= TAU;
          if (diff < -Math.PI) diff += TAU;
          dphase += COUPLE * Math.sin(diff);
        }

        // attractor stimulation perturbs phase
        dphase += stim[y][x] * Math.sin(time * FREQS[f] + field[y][x]);

        field[y][x] = (field[y][x] + dphase + TAU) % TAU;
      }
  }

  // combine fields and accumulate memory
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      // weighted sum of sin(phase) across all fields — the interference pattern
      let combined = 0;
      for (let f = 0; f < NUM_FIELDS; f++) {
        const weight = 1 / (f + 1); // fundamental weighs most
        combined += Math.sin(fields[f][y][x]) * weight;
      }
      // normalize to [0, 1]
      const intensity = (combined / 2.08 + 1) * 0.5; // 2.08 ≈ sum of weights

      // memory accumulates — the deep layer
      mem[y][x] = mem[y][x] * MEM_DECAY + intensity * MEM_BLEND;
    }
}

export function sim(x, y, t, W, H, mx, my, state, AR) {
  if (t !== state.lastT) {
    step(state, mx, my, AR);
    state.lastT = t;
  }
  // mostly memory (depth) with a whisper of live dynamics (shimmer)
  const live = Math.sin(state.fields[0][y][x]) * 0.5 + 0.5;
  const memory = state.mem[y][x] * 12;
  return memory * 0.85 + live * 0.15;
}
