export const name = "default";
export function init() { return {}; }
export function sim(x, y, t, W, H, mx, my, state, AR) {
  const nx = ((x / W) * 2 - 1) / AR;
  const ny = (y / H) * 2 - 1;
  const d = Math.sqrt(nx * nx + ny * ny);
  return (Math.sin(d * 8 - t * 2) + Math.sin(nx * 5 + t) * Math.cos(ny * 5 - t * 0.7)) * 0.5 + 0.5;
}
