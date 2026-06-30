import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 10;
const GOLD = "212,175,55";

export const CursorTrail = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: -999, y: -999 });
  const rafRef = useRef(null);

  useEffect(() => {
    // Only on non-touch desktop
    if (window.matchMedia("(hover: none)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Pre-populate particles off-screen
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current.push({
        x: -999,
        y: -999,
        size: 4 + Math.random() * 4,
        alpha: 0,
        delay: i * 3, // frames of delay
        age: 0,
      });
    }

    const trail = [];

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      trail.push({ x: e.clientX, y: e.clientY, age: 0 });
      if (trail.length > PARTICLE_COUNT * 4) trail.shift();
    };
    window.addEventListener("mousemove", onMove);

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Age trail points
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age++;
        if (trail[i].age > 30) trail.splice(i, 1);
      }

      // Draw each particle at a delayed trail position
      particles.current.forEach((p, idx) => {
        const trailIdx = trail.length - 1 - idx * 3;
        if (trailIdx < 0) return;
        const t = trail[trailIdx];
        if (!t) return;

        const lifeRatio = 1 - t.age / 30;
        const alpha = lifeRatio * 0.65;
        const size = p.size * lifeRatio;

        const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size);
        grad.addColorStop(0, `rgba(${GOLD},${alpha})`);
        grad.addColorStop(1, `rgba(${GOLD},0)`);

        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};
