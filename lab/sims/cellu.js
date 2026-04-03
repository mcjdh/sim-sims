export const name = "cellu";

const RULES = ['Conway','HighLife','DayNight','Seeds','Amoeba'];
const CYCLE = 600;
const STEP_RATE = 4; // step every N frames — slows it down to breathe

export function init() {
  const gw = 240, gh = 120;
  const grid = Array(gh).fill().map(() => Array(gw).fill(0));
  const next = Array(gh).fill().map(() => Array(gw).fill(0));

  seed(grid, gw, gh, 0.2);
  return { grid, next, gw, gh, gen: 0, rule: 0, lastT: -1, frame: 0 };
}

function seed(grid, gw, gh, density) {
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++)
      if (Math.random() < density) grid[y][x] = 1;
}

const ALIVE = 0.5; // threshold: above = alive for rules, below = fading trail

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
  }
}

function step(s, mx, my) {
  const { grid, next, gw, gh } = s;

  // inject cells near mouse
  if (mx !== 0 || my !== 0) {
    const cx = Math.floor(((mx + 1) / 2) * gw);
    const cy = Math.floor(((my + 1) / 2) * gh);
    for (let i = 0; i < 5; i++) {
      const px = (cx + Math.floor(Math.random() * 7 - 3) + gw) % gw;
      const py = (cy + Math.floor(Math.random() * 7 - 3) + gh) % gh;
      grid[py][px] = 1;
    }
  }

  let pop = 0;
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const n = count(grid, x, y, gw, gh);
      const live = grid[y][x] >= ALIVE;
      if (alive(s.rule, live, n)) {
        next[y][x] = Math.min(grid[y][x] + 0.3, 5);
        pop++;
      } else {
        next[y][x] = grid[y][x] > 0 ? grid[y][x] * 0.7 : 0;
      }
    }

  // swap
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      grid[y][x] = next[y][x];
      next[y][x] = 0;
    }

  // organic reseed — if population drops too low, sprinkle life back in
  const density = pop / (gw * gh);
  if (density < 0.01) {
    seed(grid, gw, gh, 0.15);
  } else if (density < 0.03) {
    seed(grid, gw, gh, 0.06);
  }

  s.gen++;
  // rule swap — let existing patterns adapt, no wipe
  if (s.gen % CYCLE === 0) {
    s.rule = (s.rule + 1) % RULES.length;
  }
}

export function sim(x, y, t, W, H, mx, my, state, AR) {
  if (t !== state.lastT) {
    state.frame++;
    if (state.frame % STEP_RATE === 0) step(state, mx, my);
    state.lastT = t;
  }
  return state.grid[y][x] / 5;
}
