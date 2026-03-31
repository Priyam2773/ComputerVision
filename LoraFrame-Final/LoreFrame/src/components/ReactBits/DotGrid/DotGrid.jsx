'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import './DotGrid.css';

gsap.registerPlugin(InertiaPlugin);

/* ---------------- utils ---------------- */

const throttle = (fn, limit) => {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last >= limit) {
      last = now;
      fn(...args);
    }
  };
};

const hexToRgb = hex => {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 0, g: 0, b: 0 };
};

/* ---------------- component ---------------- */

export default function DotGrid({
  dotSize = 6,
  gap = 15,
  baseColor = '#5227FF',
  activeColor = '#5227FF',
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
  style = {}
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);

  const pointerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  /* ---------------- build grid ---------------- */

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cell = dotSize + gap;
    const cols = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);

    const gridW = cols * cell - gap;
    const gridH = rows * cell - gap;

    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          _inertiaApplied: false
        });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  /* ---------------- render loop ---------------- */

  useEffect(() => {
    if (!circlePath) return;
    let raf;

    const proxSq = proximity * proximity;

    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x, y } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const dx = dot.cx - x;
        const dy = dot.cy - y;
        const d2 = dx * dx + dy * dy;

        let color = baseColor;
        if (d2 < proxSq) {
          const t = 1 - Math.sqrt(d2) / proximity;
          const r = baseRgb.r + (activeRgb.r - baseRgb.r) * t;
          const g = baseRgb.g + (activeRgb.g - baseRgb.g) * t;
          const b = baseRgb.b + (activeRgb.b - baseRgb.b) * t;
          color = `rgb(${r | 0},${g | 0},${b | 0})`;
        }

        ctx.save();
        ctx.translate(dot.cx + dot.xOffset, dot.cy + dot.yOffset);
        ctx.fillStyle = color;
        ctx.fill(circlePath);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [circlePath, proximity, baseColor, baseRgb, activeRgb]);

  /* ---------------- resize ---------------- */

  useEffect(() => {
    buildGrid();
    const ro = new ResizeObserver(buildGrid);
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [buildGrid]);

  /* ---------------- mouse interaction ---------------- */

  useEffect(() => {
    const onMove = e => {
      const pr = pointerRef.current;
      const now = performance.now();
      const dt = now - (pr.lastTime || now);

      pr.vx = ((e.clientX - pr.lastX) / dt) * 1000 || 0;
      pr.vy = ((e.clientY - pr.lastY) / dt) * 1000 || 0;
      pr.speed = Math.min(Math.hypot(pr.vx, pr.vy), maxSpeed);

      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.lastTime = now;

      const rect = canvasRef.current.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (pr.speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
          dot._inertiaApplied = true;

          gsap.to(dot, {
            inertia: {
              xOffset: dot.cx - pr.x + pr.vx * 0.005,
              yOffset: dot.cy - pr.y + pr.vy * 0.005,
              resistance
            },
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0,
                yOffset: 0,
                duration: returnDuration,
                ease: 'elastic.out(1,0.75)',
                onComplete: () => (dot._inertiaApplied = false)
              });
            }
          });
        }
      }
    };

    const throttledMove = throttle(onMove, 50);
    window.addEventListener('mousemove', throttledMove, { passive: true });
    return () => window.removeEventListener('mousemove', throttledMove);
  }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration]);

  /* ---------------- JSX ---------------- */

  return (
    <section
      className={`dot-grid ${className}`}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <div ref={wrapperRef} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </section>
  );
}
