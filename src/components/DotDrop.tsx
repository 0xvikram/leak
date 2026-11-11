"use client";

import { useEffect, useRef } from "react";

// Violet at the tip, magenta through the body, orange where it pools.
const STOPS: [number, [number, number, number]][] = [
  [0, [124, 92, 255]],
  [0.55, [177, 77, 255]],
  [1, [255, 122, 61]],
];

function colorAt(t: number): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i];
    const [p0, c0] = STOPS[i - 1];
    if (k <= p1) {
      const f = (k - p0) / (p1 - p0);
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * f)) as [number, number, number];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

type Drip = { x: number; y: number; v: number; r: number; life: number };

/** A water drop drawn as halftone dots, slowly shimmering and leaking from its base. */
export function DotDrop({ size = 420 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = size;
    const H = size * 1.25;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const R = W * 0.28;
    const cx = W / 2;
    const cy = H * 0.62;
    const tipY = cy - R * 2.15;
    const step = 9;
    const dots: { x: number; y: number; t: number; shade: number }[] = [];
    for (let y = tipY; y <= cy + R; y += step) {
      for (let x = cx - R; x <= cx + R; x += step) {
        const inCircle = (x - cx) ** 2 + (y - cy) ** 2 <= R * R;
        const above = y < cy && Math.abs(x - cx) <= R * ((y - tipY) / (cy - tipY)) ** 1.35;
        if (!inCircle && !above) continue;
        // Light from the upper left, so the drop reads as round.
        const lx = (x - (cx - R * 0.35)) / R;
        const ly = (y - (cy - R * 0.45)) / R;
        const shade = Math.max(0.15, 1 - Math.sqrt(lx * lx + ly * ly) * 0.55);
        dots.push({ x, y, t: (y - tipY) / (cy + R - tipY), shade });
      }
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const drips: Drip[] = [];
    let frame = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      const time = now / 1000;
      ctx.clearRect(0, 0, W, H);

      for (const d of dots) {
        const wave = reduce ? 0 : Math.sin(d.t * 9 - time * 2.2) * 0.22;
        const r = Math.max(0.4, (step / 2) * (0.35 + d.shade * 0.6 + wave));
        const [cr, cg, cb] = colorAt(d.t);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.35 + d.shade * 0.65})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce) {
        if (Math.random() < dt * 2.4) {
          drips.push({ x: cx + (Math.random() - 0.5) * R * 0.5, y: cy + R * 0.95, v: 20 + Math.random() * 30, r: 2 + Math.random() * 2.5, life: 1 });
        }
        for (let i = drips.length - 1; i >= 0; i--) {
          const p = drips[i];
          p.v += 140 * dt;
          p.y += p.v * dt;
          p.life -= dt * 0.55;
          if (p.life <= 0 || p.y > H) {
            drips.splice(i, 1);
            continue;
          }
          ctx.fillStyle = `rgba(255,122,61,${p.life})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        frame = requestAnimationFrame(draw);
      }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [size]);

  return (
    <div className="relative mx-auto" style={{ width: size, maxWidth: "100%" }}>
      <div className="pointer-events-none absolute inset-[15%] rounded-full bg-[radial-gradient(circle,rgba(177,77,255,0.45),rgba(255,122,61,0.12)_45%,transparent_70%)] blur-3xl" />
      <canvas ref={ref} aria-hidden className="relative h-auto w-full" style={{ aspectRatio: "1 / 1.25" }} />
    </div>
  );
}
