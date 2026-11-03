'use client';

import * as React from 'react';

export function DotGrid() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isMobile = width < 768;

    const spacing = 32;
    let mouse = { x: -1000, y: -1000 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      drawStatic();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(215, 215, 222, 0.6)';
      for (let x = 16; x < width; x += spacing) {
        for (let y = 16; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let x = 16; x < width; x += spacing) {
        for (let y = 16; y < height; y += spacing) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;

          ctx.beginPath();
          if (dist < maxDist) {
            const factor = 1 - dist / maxDist;
            ctx.fillStyle = `rgba(99, 102, 241, ${0.35 + factor * 0.45})`;
            ctx.arc(x, y, 1.5 + factor * 2, 0, Math.PI * 2);
          } else {
            ctx.fillStyle = 'rgba(215, 215, 222, 0.6)';
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);

    if (prefersReducedMotion || isMobile) {
      drawStatic();
    } else {
      window.addEventListener('mousemove', handleMouseMove);
      animate();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

