"use client";

import { useEffect, useRef } from "react";

/**
 * A deliberately quiet cursor trail: it only activates for a fine pointer and
 * never intercepts interaction. Canvas keeps this independent from React's
 * render cycle, while the short-lived nodes read as a tiny constellation.
 */
export default function ConstellationCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    type Star = { x: number; y: number; born: number };
    const stars: Star[] = [];
    let frame = 0;
    let last = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const move = (event: PointerEvent) => {
      const now = performance.now();
      if (now - last < 52) return;
      last = now;
      stars.push({ x: event.clientX, y: event.clientY, born: now });
      if (stars.length > 11) stars.shift();
    };
    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const live = stars.filter((star) => now - star.born < 760);
      stars.splice(0, stars.length, ...live);
      for (let i = 1; i < live.length; i += 1) {
        const a = live[i - 1], b = live[i];
        const alpha = Math.max(0, 1 - (now - a.born) / 760) * 0.34;
        context.strokeStyle = `rgba(174, 235, 255, ${alpha})`;
        context.lineWidth = 0.75;
        context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
      }
      for (const star of live) {
        const alpha = Math.max(0, 1 - (now - star.born) / 760);
        context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        context.beginPath(); context.arc(star.x, star.y, 1.6, 0, Math.PI * 2); context.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    resize(); window.addEventListener("resize", resize); window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); };
  }, []);

  return <canvas className="constellation-cursor" ref={canvasRef} aria-hidden="true" />;
}
