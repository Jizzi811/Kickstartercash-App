import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  Audio,
  staticFile,
  interpolate,
  Easing,
} from 'remotion';


const FPS = 30;
const TOTAL_SECONDS = 300;

// Seeded random for consistent particles
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const PARTICLE_COUNT = 80;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: seededRand(i * 7) * 100,
  y: seededRand(i * 13) * 100,
  size: 2 + seededRand(i * 3) * 5,
  duration: 2 + seededRand(i * 11) * 4,
  delay: seededRand(i * 17) * 5,
  driftX: (seededRand(i * 5) - 0.5) * 3,
  driftY: -(1 + seededRand(i * 9) * 3),
  opacity: 0.4 + seededRand(i * 19) * 0.6,
}));

const RAY_COUNT = 16;
const rays = Array.from({ length: RAY_COUNT }, (_, i) => ({
  angle: (i / RAY_COUNT) * 360,
  width: 1 + seededRand(i * 23) * 3,
  opacity: 0.06 + seededRand(i * 29) * 0.12,
  length: 55 + seededRand(i * 31) * 20,
}));

export const CountdownVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = frame / fps;
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const countdownText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Slow rotation for rays
  const rayRotation = (frame / fps) * 3;

  // Subtle pulse for countdown (once per second)
  const secondFraction = (frame % fps) / fps;
  const pulse = interpolate(secondFraction, [0, 0.1, 1], [1.06, 1, 1], {
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>

      <style>{`
        @font-face {
          font-family: 'Poppins';
          src: url('/Poppins-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
        }
      `}</style>

      {/* Audio */}
      <Audio src={staticFile('music.mp3')} />

      {/* Background image */}
      <img
        src={staticFile('banner.png')}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Dark overlay — very subtle, keeps image visible */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 100%)',
      }} />

      {/* Light rays from globe center */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '52%',
        transform: `translate(-50%, -50%) rotate(${rayRotation}deg)`,
        width: 0, height: 0,
      }}>
        {rays.map((ray) => (
          <div
            key={ray.angle}
            style={{
              position: 'absolute',
              left: 0, top: 0,
              width: `${ray.length}vw`,
              height: `${ray.width}px`,
              marginTop: `-${ray.width / 2}px`,
              transformOrigin: '0 50%',
              transform: `rotate(${ray.angle}deg)`,
              background: `linear-gradient(to right, rgba(255,200,50,${ray.opacity * 2}), rgba(255,200,50,${ray.opacity}), transparent)`,
            }}
          />
        ))}
      </div>

      {/* Glitter particles */}
      {particles.map((p) => {
        const t = ((elapsed + p.delay) % p.duration) / p.duration;
        const fadeIn = Math.min(t * 6, 1);
        const fadeOut = Math.max(0, 1 - (t - 0.7) * 3.3);
        const alpha = fadeIn * fadeOut * p.opacity;
        const yOff = t * p.driftY * 15;
        const xOff = t * p.driftX * 5;
        const twinkle = 0.6 + 0.4 * Math.sin(elapsed * 3 + p.id);

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x + xOff}%`,
              top: `${p.y + yOff}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `rgba(255, 210, 60, ${alpha * twinkle})`,
              boxShadow: `0 0 ${p.size * 2}px ${p.size}px rgba(255, 200, 50, ${alpha * 0.5 * twinkle})`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}

      {/* Sparkle cross shapes on some particles */}
      {particles.filter((_, i) => i % 5 === 0).map((p) => {
        const t = ((elapsed + p.delay) % p.duration) / p.duration;
        const fadeIn = Math.min(t * 6, 1);
        const fadeOut = Math.max(0, 1 - (t - 0.7) * 3.3);
        const alpha = fadeIn * fadeOut * p.opacity * 0.8;
        const yOff = t * p.driftY * 15;
        const xOff = t * p.driftX * 5;
        const rot = elapsed * 60 + p.id * 30;

        return (
          <div key={`sparkle-${p.id}`} style={{
            position: 'absolute',
            left: `${p.x + xOff}%`,
            top: `${p.y + yOff}%`,
            transform: `translate(-50%, -50%) rotate(${rot}deg)`,
          }}>
            <div style={{ position: 'absolute', width: p.size * 4, height: 1.5, background: `rgba(255,230,100,${alpha})`, left: -p.size * 2, top: 0 }} />
            <div style={{ position: 'absolute', height: p.size * 4, width: 1.5, background: `rgba(255,230,100,${alpha})`, top: -p.size * 2, left: 0 }} />
          </div>
        );
      })}

      {/* Countdown — centered lower half, black text with gold glow */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '62%',
        transform: `translate(-50%, -50%) scale(${pulse})`,
        textAlign: 'center',
        userSelect: 'none',
      }}>
        <div style={{
          fontFamily: '"Arial Black", "Arial Bold", Arial, sans-serif',
          fontWeight: 900,
          fontSize: 160,
          lineHeight: 1,
          color: '#ffffff',
          WebkitTextStroke: '3px #c8940a',
          textShadow: [
            '0 0 30px rgba(255,200,50,1)',
            '0 0 60px rgba(255,180,20,0.7)',
            '0 0 100px rgba(255,160,0,0.4)',
            '4px 4px 0 rgba(180,120,0,0.5)',
          ].join(', '),
          letterSpacing: '0.05em',
        }}>
          {countdownText}
        </div>
        <div style={{
          fontFamily: '"Poppins", "Segoe UI", Arial, sans-serif',
          fontWeight: 500,
          fontSize: 32,
          background: 'linear-gradient(90deg, #ffffff 0%, #ffd700 40%, #ffb800 60%, #ffffff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.15em',
          marginTop: 16,
          textShadow: 'none',
          filter: 'drop-shadow(0 0 12px rgba(255,200,50,0.9)) drop-shadow(0 0 24px rgba(255,180,20,0.5))',
        }}>
          Wir starten in Kürze
        </div>
      </div>

    </div>
  );
};
