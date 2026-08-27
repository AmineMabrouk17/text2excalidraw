import React, { useEffect, useRef } from "react";

// Excalidraw-style loading animation: a constellation of dots drifts, connects
// with faint lines, and a few "ink" points travel along the edges — evoking a
// hand-drawn diagram being sketched. Pure canvas, no deps, respects the
// Excalidraw purple (#6965db) palette.
export default function LoadingCanvas({ label = "Sketching your diagram…" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h, dpr;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Build nodes scattered around the center.
    const N = 26;
    const nodes = Array.from({ length: N }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 60 + Math.random() * 160,
      sp: 0.002 + Math.random() * 0.006,
      ph: Math.random() * Math.PI * 2,
      size: 2 + Math.random() * 3,
    }));
    // Travelling "pen" dots along a virtual path.
    const pens = Array.from({ length: 5 }, () => ({
      t: Math.random(),
      sp: 0.0015 + Math.random() * 0.003,
      size: 3 + Math.random() * 2,
    }));

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const pts = nodes.map((n) => {
        const ang = n.a + time * n.sp;
        return {
          x: cx + Math.cos(ang) * n.r,
          y: cy + Math.sin(ang) * n.r * 0.8,
          size: n.size,
        };
      });

      // Faint connecting lines between near points.
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(105,101,219,${0.10 * (1 - d / 130)})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // Travelling ink dots along the ring.
      pens.forEach((p) => {
        p.t += p.sp;
        if (p.t > 1) p.t -= 1;
        const ang = p.t * Math.PI * 2 + p.ph;
        const x = cx + Math.cos(ang) * 150;
        const y = cy + Math.sin(ang) * 120;
        ctx.fillStyle = "rgba(139,135,255,0.9)";
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // The constellation nodes (pulsing).
      pts.forEach((pt, i) => {
        const pulse = 0.6 + 0.4 * Math.sin(time * 0.003 + i);
        ctx.fillStyle = `rgba(105,101,219,${0.55 + 0.35 * pulse})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (0.8 + 0.4 * pulse), 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="loading-canvas">
      <canvas ref={canvasRef} className="loading-canvas__canvas" />
      <div className="loading-canvas__label">
        <span className="loading-canvas__dot" />
        {label}
      </div>
    </div>
  );
}
