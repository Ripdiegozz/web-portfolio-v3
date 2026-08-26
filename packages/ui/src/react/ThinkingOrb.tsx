import { useEffect, useRef, type HTMLAttributes } from 'react';

export type OrbState =
  | 'composing' // Ribbon undulating sash
  | 'working'   // Orbits
  | 'searching' // Globe
  | 'listening' // Wave
  | 'breathing' // Ring
  | 'shaping'   // Morph
  | 'idle';

export interface ThinkingOrbProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  state?: OrbState;
  color?: string; // Optional accent color override
  speed?: number;
}

interface Dot {
  x: number;
  y: number;
  z: number;
  r: number;
  white: number;
  a?: number;
}

function fibDir(i: number, n: number): [number, number, number] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (2 * (i + 0.5)) / n;
  const rad = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * i;
  return [rad * Math.cos(theta), y, rad * Math.sin(theta)];
}

function makeProj(roll: number, pitch: number, cx: number, cy: number, scale = 1) {
  const sinP = Math.sin(pitch);
  const cosP = Math.cos(pitch);
  const sinR = Math.sin(roll);
  const cosR = Math.cos(roll);

  return (x: number, y: number, z: number): [number, number, number] => {
    const rx = x * cosR + z * sinR;
    const rz = -x * sinR + z * cosR;
    const py = y * cosP - rz * sinP;
    const pz = y * sinP + rz * cosP;
    return [cx + rx * scale, cy - py * scale, pz];
  };
}

/**
 * Exact mathematical implementation of "composing" (Ribbon) state.
 * An undulating sash of parallel strands riding a great circle with a ghost sphere backdrop.
 */
function frameRibbon(size: number, t: number, opts: {
  spin?: number;
  faceOn?: boolean;
  wobMul?: number;
  ghostN?: number;
  lanes?: number;
  segs?: number;
  bandMul?: number;
  rsPow?: number;
  rBase?: number;
  rDepth?: number;
  rMin?: number;
} = {}): Dot[] {
  const cx = size / 2;
  const cy = size / 2;
  const R = (size / 2) * 0.78;
  const spin = opts.spin ?? 1;
  const camTilt = 0.3;
  const pt = makeProj(t * 0.1 * spin, camTilt, cx, cy, 1);
  const rs = Math.pow(size / 300, opts.rsPow ?? 0.6);

  const dots: Dot[] = [];
  const ghostN = opts.ghostN ?? (size <= 32 ? 35 : 90);

  // Background ghost sphere
  for (let i = 0; i < ghostN; i++) {
    const d = fibDir(i, ghostN);
    const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
    const depth = (z / R + 1) / 2;
    dots.push({ x: px, y: py, z, r: Math.max(0.6, 0.8 * rs), white: 0.78, a: 0.1 + 0.22 * depth });
  }

  // Precessing band plane
  const ya = t * 0.24 * spin;
  const ta = opts.faceOn ? -camTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
  const ux = Math.cos(ya);
  const uy = 0;
  const uz = Math.sin(ya);
  const vx = -uz * Math.sin(ta);
  const vy = Math.cos(ta);
  const vz = ux * Math.sin(ta);

  // Plane normal n = u × v
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;

  const wobAmp = 0.23 * (opts.wobMul ?? 1);
  const baseR = opts.faceOn ? R / (1 + 0.85 * wobAmp) : R;

  const baseLanes = opts.lanes ?? (size <= 32 ? 3 : 5);
  const segs = opts.segs ?? (size <= 32 ? 36 : 64);
  const lanes = Math.max(1, Math.round(baseLanes * (opts.bandMul ?? 1)));

  for (let w = 0; w < lanes; w++) {
    const laneOff = (w - (lanes - 1) / 2) * 0.075;
    const edge = Math.abs(w - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);

    for (let k = 0; k < segs; k++) {
      const a = (k / segs) * 2 * Math.PI;
      const wob =
        (0.16 * Math.sin(a * 3 - t * 1.7 + w * 0.22) + 0.07 * Math.sin(a * 5 + t * 1.1)) *
        (opts.wobMul ?? 1);
      const radial = opts.faceOn ? 1 + wob : 1;
      const off = opts.faceOn ? laneOff : laneOff + wob;

      const x = ux * Math.cos(a) + vx * Math.sin(a) + nx * off;
      const y = uy * Math.cos(a) + vy * Math.sin(a) + ny * off;
      const z = uz * Math.cos(a) + vz * Math.sin(a) + nz * off;
      const l = Math.sqrt(x * x + y * y + z * z);
      const rr = baseR * radial;

      const [px, py, zr] = pt((x / l) * rr, (y / l) * rr, (z / l) * rr);
      const depth = (zr / R + 1) / 2;

      dots.push({
        x: px,
        y: py,
        z: zr,
        r: Math.max(0.6, ((opts.rBase ?? 1.1) + (opts.rDepth ?? 1.7) * depth) * (1 - 0.25 * edge) * rs * (size / 48)),
        white: 0.52 - 0.44 * depth + 0.18 * edge,
        a: 0.4 + 0.6 * depth,
      });
    }
  }

  // Depth sorting
  const filtered = dots.filter((d) => (d.a ?? 1) >= 0.02);
  filtered.sort((a, b) => a.z - b.z);
  return filtered;
}

export function ThinkingOrb({
  size = 48,
  state = 'composing',
  color,
  speed = 1,
  className = '',
  ...props
}: ThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const render = () => {
      const isDark =
        typeof document !== 'undefined'
          ? document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches
          : true;

      time += 0.03 * speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dots = frameRibbon(size * dpr, time, {
        rsPow: 0.6,
        rBase: 1.2,
        rDepth: 1.8,
        wobMul: 1.1,
      });

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        if (!dot) continue;

        const a = dot.a ?? 1;
        const u = Math.min(1, Math.max(0, dot.white));
        const ink = Math.round((isDark ? 1 - u : u) * 255);

        ctx.fillStyle = color ? color : `rgba(${ink}, ${ink}, ${ink}, ${a})`;
        if (color) ctx.globalAlpha = a;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size, speed, color]);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="pointer-events-none block"
      />
    </div>
  );
}
