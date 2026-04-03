export const name = "waves";
export function init() { return {}; }
export function sim(x, y, t, W, H, mx, my, state, AR) {
  const nx = ((x / W) * 2 - 1) / AR;
  const ny = (y / H) * 2 - 1;

  const d1 = Math.sqrt(nx * nx + ny * ny);
  const w1 = Math.sin(d1 * 6 - t * 5);

  const sx2 = Math.sin(t) * 0.6, sy2 = Math.cos(t * 1.5) * 0.5;
  const d2 = Math.sqrt((nx - sx2) ** 2 + (ny - sy2) ** 2);
  const w2 = Math.sin(d2 * 5 - t * 4);

  const sx3 = Math.cos(t * 1.25) * 0.5, sy3 = Math.sin(t) * 0.4;
  const d3 = Math.sqrt((nx - sx3) ** 2 + (ny - sy3) ** 2);
  const w3 = Math.sin(d3 * 4 - t * 6);

  const breath = Math.sin(t * 2.5) * 0.2 + 0.8;
  return ((w1 + w2 * 0.7 + w3 * 0.5) * breath + 2.2) / 4.4;
}
