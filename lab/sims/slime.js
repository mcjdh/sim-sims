export const name = "slime";

// physarum parameters — tuned for network emergence
const N = 8000;             // agent count
const SENSOR_ANGLE = 0.8;   // radians (~45°) — wider = more branching
const SENSOR_DIST = 5;      // cells ahead to sense — shorter = more responsive
const TURN_SPEED = 0.5;     // reorientation rate
const MOVE_SPEED = 0.8;     // step size — slightly under 1 to reduce overshoot
const DEPOSIT = 0.15;       // single-cell deposit — diffusion handles spreading
const DECAY = 0.95;         // aggressive decay clears empty areas, sharpens veins
const MOUSE_DEPOSIT = 3;    // food source strength
const MOUSE_RADIUS = 6;     // food source radius

export function init() {
  const gw = 240, gh = 120;
  const trail = Array.from({ length: gh }, () => new Float32Array(gw));
  const temp = Array.from({ length: gh }, () => new Float32Array(gw));

  const agents = [];
  for (let i = 0; i < N; i++) {
    agents.push({
      x: Math.random() * gw,
      y: Math.random() * gh,
      a: Math.random() * Math.PI * 2
    });
  }

  return { trail, temp, agents, gw, gh, lastT: -1 };
}

function sense(trail, x, y, angle, dist, gw, gh, ar) {
  const sx = Math.round(x + Math.cos(angle) * dist / ar);
  const sy = Math.round(y + Math.sin(angle) * dist);
  let sum = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      sum += trail[((sy + dy) % gh + gh) % gh][((sx + dx) % gw + gw) % gw];
  return sum;
}

// diffuse (3x3 blur) + decay in one pass
function diffuse(trail, temp, gw, gh) {
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          sum += trail[((y + dy) % gh + gh) % gh][((x + dx) % gw + gw) % gw];
      temp[y][x] = (sum / 9) * DECAY;
    }
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++)
      trail[y][x] = temp[y][x];
}

function step(s, mx, my, ar) {
  const { trail, temp, agents, gw, gh } = s;

  for (let i = 0; i < agents.length; i++) {
    const p = agents[i];

    const fwd = sense(trail, p.x, p.y, p.a, SENSOR_DIST, gw, gh, ar);
    const lft = sense(trail, p.x, p.y, p.a - SENSOR_ANGLE, SENSOR_DIST, gw, gh, ar);
    const rgt = sense(trail, p.x, p.y, p.a + SENSOR_ANGLE, SENSOR_DIST, gw, gh, ar);

    // continuous steering — all three sensors contribute
    const maxSense = Math.max(fwd, lft, rgt);
    const clarity = maxSense > 0 ? (maxSense - Math.min(fwd, lft, rgt)) / maxSense : 0;
    const steer = (rgt - lft) / (maxSense + 0.001);
    const fwdConf = fwd / (maxSense + 0.001); // strong forward = dampen turns
    const wobble = 0.5 + (1 - clarity) * 1.2;
    p.a += steer * TURN_SPEED * (1.5 - fwdConf) + (Math.random() - 0.5) * wobble;

    p.x += Math.cos(p.a) * MOVE_SPEED / ar;
    p.y += Math.sin(p.a) * MOVE_SPEED;

    p.x = ((p.x % gw) + gw) % gw;
    p.y = ((p.y % gh) + gh) % gh;

    // diminishing deposit — highways can't become infinitely attractive
    const gx = Math.floor(p.x), gy = Math.floor(p.y);
    const existing = trail[gy][gx];
    trail[gy][gx] = Math.min(1, existing + DEPOSIT * (1 - existing));
  }

  // mouse = food source
  const cx = Math.floor(((mx + 1) / 2) * gw);
  const cy = Math.floor(((my + 1) / 2) * gh);
  const rx = Math.ceil(MOUSE_RADIUS / ar);
  const mr2 = MOUSE_RADIUS * MOUSE_RADIUS;
  for (let dy = -MOUSE_RADIUS; dy <= MOUSE_RADIUS; dy++) {
    const dy2 = dy * dy;
    if (dy2 >= mr2) continue;
    const fy = ((cy + dy) % gh + gh) % gh;
    for (let dx = -rx; dx <= rx; dx++) {
      const adx = dx * ar;
      const d2 = adx * adx + dy2;
      if (d2 < mr2) {
        const fx = ((cx + dx) % gw + gw) % gw;
        trail[fy][fx] = Math.min(1, trail[fy][fx] + MOUSE_DEPOSIT / (1 + d2));
      }
    }
  }

  diffuse(trail, temp, gw, gh);
}

export function sim(x, y, t, W, H, mx, my, state, AR) {
  if (t !== state.lastT) {
    step(state, mx, my, AR);
    state.lastT = t;
  }
  return state.trail[y][x];
}
