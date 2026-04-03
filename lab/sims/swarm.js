export const name = "swarm";

const N = 80;
const PERCEPTION = 0.08;
const TRAIL_DECAY = 0.975;
const MAX_SPEED = 0.003;
const MIN_SPEED = 0.0005;

export function init() {
  const agents = [];
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    agents.push({
      x: Math.random(), y: Math.random(),
      vx: Math.cos(a) * 0.001,
      vy: Math.sin(a) * 0.001,
      energy: 0.3 + Math.random() * 0.7
    });
  }
  const gw = 240, gh = 120;
  const field = Array.from({ length: gh }, () => new Float32Array(gw));
  return { agents, field, gw, gh, lastT: -1 };
}

function wrap(d) { return d > 0.5 ? d - 1 : d < -0.5 ? d + 1 : d; }

function step(s, mx, my, ar) {
  const { agents, field, gw, gh } = s;
  const vAR = (gw / gh) * ar; // visual aspect — hoist once

  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++)
      field[y][x] *= TRAIL_DECAY;

  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    let sepX = 0, sepY = 0;
    let aliX = 0, aliY = 0;
    let cohX = 0, cohY = 0;
    let neighbors = 0;

    for (let j = 0; j < agents.length; j++) {
      if (i === j) continue;
      const b = agents[j];
      const rdx = wrap(b.x - a.x), rdy = wrap(b.y - a.y);
      const vdx = rdx * vAR; // visual-space delta
      const d = Math.sqrt(vdx * vdx + rdy * rdy);

      if (d < PERCEPTION && d > 0.001) {
        neighbors++;
        sepX -= vdx / (d * d);
        sepY -= rdy / (d * d);
        aliX += b.vx;
        aliY += b.vy;
        cohX += vdx;
        cohY += rdy;

        if (j > i && d < PERCEPTION * 0.4) {
          const transfer = (a.energy - b.energy) * 0.02;
          a.energy = Math.max(0, Math.min(1, a.energy - transfer));
          b.energy = Math.max(0, Math.min(1, b.energy + transfer));
        }
      }
    }

    if (neighbors > 0) {
      const sepLen = Math.sqrt(sepX * sepX + sepY * sepY);
      if (sepLen > 0) { sepX /= sepLen; sepY /= sepLen; }

      aliX /= neighbors; aliY /= neighbors;
      aliX -= a.vx; aliY -= a.vy;

      cohX /= neighbors; cohY /= neighbors;
      const cohLen = Math.sqrt(cohX * cohX + cohY * cohY);
      if (cohLen > 0) { cohX /= cohLen; cohY /= cohLen; }

      // sep/coh are visual-space — convert x back to agent-space
      a.vx += (sepX / vAR) * 0.00025 + aliX * 0.04 + (cohX / vAR) * 0.00015;
      a.vy += sepY * 0.00025 + aliY * 0.04 + cohY * 0.00015;
    }

    const mrdx = wrap((mx + 1) / 2 - a.x), mrdy = wrap((my + 1) / 2 - a.y);
    const mvdx = mrdx * vAR;
    const md = Math.sqrt(mvdx * mvdx + mrdy * mrdy);
    if (md > 0.01) {
      a.vx += (mvdx / md / vAR) * 0.00008;
      a.vy += (mrdy / md) * 0.00008;
    }

    a.vx += (Math.random() - 0.5) * 0.00005;
    a.vy += (Math.random() - 0.5) * 0.00005;

    // drag first, then enforce speed bounds
    a.vx *= 0.995; a.vy *= 0.995;
    let speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    if (speed > MAX_SPEED) {
      a.vx = (a.vx / speed) * MAX_SPEED;
      a.vy = (a.vy / speed) * MAX_SPEED;
    } else if (speed < MIN_SPEED) {
      // stalled — pick a random direction
      const angle = Math.random() * Math.PI * 2;
      a.vx = Math.cos(angle) * MIN_SPEED;
      a.vy = Math.sin(angle) * MIN_SPEED;
    }

    a.x = ((a.x + a.vx) % 1 + 1) % 1;
    a.y = ((a.y + a.vy) % 1 + 1) % 1;

    a.energy = Math.max(0.1, Math.min(1, a.energy + 0.0005));

    const gx = Math.floor(a.x * gw);
    const gy = Math.floor(a.y * gh);
    const rx = Math.ceil(2 / ar), ry = 2;
    for (let dy = -ry; dy <= ry; dy++)
      for (let dx = -rx; dx <= rx; dx++) {
        const fx = (gx + dx + gw) % gw;
        const fy = (gy + dy + gh) % gh;
        const adx = dx * ar;
        const falloff = 1 / (1 + (adx * adx + dy * dy) * 0.8);
        field[fy][fx] = Math.min(1, field[fy][fx] + a.energy * falloff * 0.15);
      }
  }
}

export function sim(x, y, t, W, H, mx, my, state, AR) {
  if (t !== state.lastT) {
    step(state, mx, my, AR);
    state.lastT = t;
  }
  return state.field[y][x];
}
