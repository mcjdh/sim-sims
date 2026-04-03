export const name = "cellu";

const RULES = ['Conway','HighLife','DayNight','Seeds','Amoeba'];
const CYCLE = 600;        // generations per rule
const STEP_RATE = 4;      // frames between steps
const ALIVE = 0.5;        // threshold for rule evaluation
const AGE_RATE = 0.3;     // how fast living cells brighten
const FADE_RATE = 0.7;    // how fast dead cells dim
const MAX_AGE = 5;        // brightness cap
const SEED_DENSITY = 0.2; // initial fill ratio
const RESEED_HEAVY = 0.15;// reseed density when near-extinct
const RESEED_LIGHT = 0.06;// reseed density when sparse
const POP_CRIT = 0.01;    // critical low population
const POP_LOW = 0.03;     // low population
const BRUSH_SIZE = 3;     // mouse paint radius (y)
const BRUSH_COUNT = 5;    // cells injected per step

export function init() {
  const gw = 240, gh = 120;
  const grid = Array.from({ length: gh }, () => new Float32Array(gw));
  const next = Array.from({ length: gh }, () => new Float32Array(gw));

  seed(grid, gw, gh, SEED_DENSITY);
  return { grid, next, gw, gh, gen: 0, rule: 0, lastT: -1, frame: 0, pmx: 0, pmy: 0 };
}

function seed(grid, gw, gh, density) {
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++)
      if (Math.random() < density) grid[y][x] = 1;
}

function count(grid, x, y, gw, gh) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      n += grid[(y + dy + gh) % gh][(x + dx + gw) % gw] >= ALIVE ? 1 : 0;
    }
  return n;
}

function alive(rule, live, n) {
  switch (rule) {
    case 0: return live ? (n === 2 || n === 3) : n === 3;
    case 1: return live ? (n === 2 || n === 3) : (n === 3 || n === 6);
    case 2: return live ? (n>=3&&n<=4||n>=6) : (n===3||n>=6);
    case 3: return live ? false : n === 2;
    case 4: return live ? (n===1||n===3||n===5||n===8) : (n===3||n===5||n===7);
    default: return false;
  }
}

function step(s, mx, my, ar) {
  const { grid, next, gw, gh } = s;

  // inject cells only when mouse is actively moving
  if (mx !== s.pmx || my !== s.pmy) {
    const cx = Math.floor(((mx + 1) / 2) * gw);
    const cy = Math.floor(((my + 1) / 2) * gh);
    const rx = Math.ceil(BRUSH_SIZE / ar);
    for (let i = 0; i < BRUSH_COUNT; i++) {
      const px = (cx + Math.floor(Math.random() * rx * 2 - rx) + gw) % gw;
      const py = (cy + Math.floor(Math.random() * BRUSH_SIZE * 2 - BRUSH_SIZE) + gh) % gh;
      grid[py][px] = 1;
    }
    s.pmx = mx; s.pmy = my;
  }

  let pop = 0;
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const n = count(grid, x, y, gw, gh);
      const live = grid[y][x] >= ALIVE;
      if (alive(s.rule, live, n)) {
        next[y][x] = Math.min(grid[y][x] + AGE_RATE, MAX_AGE);
        pop++;
      } else {
        next[y][x] = grid[y][x] > 0 ? grid[y][x] * FADE_RATE : 0;
      }
    }

  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      grid[y][x] = next[y][x];
      next[y][x] = 0;
    }

  const density = pop / (gw * gh);
  if (density < POP_CRIT) {
    seed(grid, gw, gh, RESEED_HEAVY);
  } else if (density < POP_LOW) {
    seed(grid, gw, gh, RESEED_LIGHT);
  }

  s.gen++;
  if (s.gen % CYCLE === 0) {
    s.rule = (s.rule + 1) % RULES.length;
  }
}

export function sim(x, y, t, W, H, mx, my, state, AR) {
  if (t !== state.lastT) {
    state.frame++;
    if (state.frame % STEP_RATE === 0) step(state, mx, my, AR);
    state.lastT = t;
  }
  return state.grid[y][x] / MAX_AGE;
}
