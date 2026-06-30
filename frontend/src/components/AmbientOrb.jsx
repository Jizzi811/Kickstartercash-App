import { useEffect, useRef } from "react";

const LERP = 0.05;
const ORB_SIZE = 600;

export const AmbientOrb = () => {
  const orbRef = useRef(null);
  const pos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const target = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * LERP;
      pos.current.y += (target.current.y - pos.current.y) * LERP;

      if (orbRef.current) {
        orbRef.current.style.transform = `translate(${pos.current.x - ORB_SIZE / 2}px, ${pos.current.y - ORB_SIZE / 2}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={orbRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: ORB_SIZE,
        height: ORB_SIZE,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(212,175,55,0.07) 0%, rgba(212,175,55,0.02) 50%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
        willChange: "transform",
        filter: "blur(40px)",
      }}
    />
  );
};
