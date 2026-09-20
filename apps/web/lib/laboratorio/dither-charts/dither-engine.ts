export const smoothstep = (min: number, max: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

export const hash = (x: number, y: number) => {
  let h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return h - Math.floor(h);
};

export const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  rTop: number, rBottom: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + rTop, y);
  ctx.lineTo(x + w - rTop, y);
  ctx.arcTo(x + w, y, x + w, y + rTop, rTop);
  ctx.lineTo(x + w, y + h - rBottom);
  ctx.arcTo(x + w, y + h, x + w - rBottom, y + h, rBottom);
  ctx.lineTo(x + rBottom, y + h);
  ctx.arcTo(x, y + h, x, y + h - rBottom, rBottom);
  ctx.lineTo(x, y + rTop);
  ctx.arcTo(x, y, x + rTop, y, rTop);
  ctx.closePath();
};

export const drawRoundedWedge = (
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rIn: number, rOut: number,
  aStart: number, aEnd: number,
  cr: number
) => {
  const sweep = aEnd - aStart;
  const maxCr = Math.min(cr, (rOut - rIn) / 2, (sweep * rIn) / 2);
  if (sweep <= 0.001) return;
  const crIn = maxCr;
  const crOut = maxCr;

  const aStartIn = aStart + crIn / rIn;
  const aEndIn = aEnd - crIn / rIn;
  const aStartOut = aStart + crOut / rOut;
  const aEndOut = aEnd - crOut / rOut;

  ctx.moveTo(cx + rIn * Math.cos(aStartIn), cy + rIn * Math.sin(aStartIn));
  ctx.arc(cx, cy, rIn, aStartIn, aEndIn);
  ctx.arcTo(
    cx + rIn * Math.cos(aEnd), cy + rIn * Math.sin(aEnd),
    cx + rOut * Math.cos(aEnd), cy + rOut * Math.sin(aEnd),
    crIn
  );
  ctx.arcTo(
    cx + rOut * Math.cos(aEnd), cy + rOut * Math.sin(aEnd),
    cx + rOut * Math.cos(aEndOut), cy + rOut * Math.sin(aEndOut),
    crOut
  );
  ctx.arc(cx, cy, rOut, aEndOut, aStartOut, true);
  ctx.arcTo(
    cx + rOut * Math.cos(aStart), cy + rOut * Math.sin(aStart),
    cx + rIn * Math.cos(aStart), cy + rIn * Math.sin(aStart),
    crOut
  );
  ctx.arcTo(
    cx + rIn * Math.cos(aStart), cy + rIn * Math.sin(aStart),
    cx + rIn * Math.cos(aStartIn), cy + rIn * Math.sin(aStartIn),
    crIn
  );
};

export const getAxisMax = (maxVal: number) => {
  if (maxVal === 0) return 100;
  const target = maxVal * 1.05;
  const power = Math.pow(10, Math.floor(Math.log10(target)));
  const normalized = target / power;
  let multiplier = 10;
  if (normalized <= 1.0) multiplier = 1;
  else if (normalized <= 2.0) multiplier = 2;
  else if (normalized <= 5.0) multiplier = 5;
  return multiplier * power;
};

export const formatCurrency = (val: number) => {
  if (val === 0) return 'R$ 0';
  if (val >= 1_000_000) return 'R$ ' + (val / 1_000_000).toPrecision(3).replace(/\.0+$/, '') + ' mi';
  if (val >= 1_000) return 'R$ ' + (val / 1_000).toPrecision(3).replace(/\.0+$/, '') + ' mil';
  return 'R$ ' + val;
};
