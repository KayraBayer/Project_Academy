import { useEffect, useRef } from 'react';

function getThemeColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    grid: isDark ? 'rgba(147, 197, 253, 0.11)' : 'rgba(47, 128, 237, 0.095)',
    gridSoft: isDark ? 'rgba(147, 197, 253, 0.045)' : 'rgba(47, 128, 237, 0.04)',
    basin: isDark ? 'rgba(147, 197, 253, 0.14)' : 'rgba(47, 128, 237, 0.13)',
    basinDark: isDark ? 'rgba(8, 16, 30, 0.28)' : 'rgba(255, 255, 255, 0.32)',
  };
}

export default function SpacetimeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, strength: 0 };
    const target = { x: pointer.x, y: pointer.y, active: false };
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame = 0;
    let paused = false;

    function scheduleFrame() {
      if (!paused && !animationFrame) animationFrame = window.requestAnimationFrame(draw);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      target.x = Math.min(target.x, width);
      target.y = Math.min(target.y, height);
    }

    function handlePointerMove(event) {
      target.x = event.clientX;
      target.y = event.clientY;
      target.active = true;
    }

    function handlePointerLeave() {
      target.active = false;
    }

    function pauseAnimation() {
      paused = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }

    function resumeAnimation() {
      paused = false;
      scheduleFrame();
    }

    function warpPoint(x, y, radius, strength) {
      const dx = pointer.x - x;
      const dy = pointer.y - y;
      const distanceSquared = dx * dx + dy * dy;
      const falloff = Math.exp(-distanceSquared / (radius * radius));
      const pull = falloff * 0.34 * strength;
      const sink = falloff * 18 * strength;

      return {
        x: x + dx * pull,
        y: y + dy * pull + sink,
      };
    }

    function drawWarpedLine(points, radius, strength, strokeStyle, lineWidth) {
      context.beginPath();
      points.forEach((point, index) => {
        const warped = warpPoint(point.x, point.y, radius, strength);
        if (index === 0) context.moveTo(warped.x, warped.y);
        else context.lineTo(warped.x, warped.y);
      });
      context.strokeStyle = strokeStyle;
      context.lineWidth = lineWidth;
      context.stroke();
    }

    function makeHorizontalPoints(y, sample) {
      const points = [];
      for (let x = -sample * 2; x <= width + sample * 2; x += sample) {
        points.push({ x, y });
      }
      return points;
    }

    function makeVerticalPoints(x, sample) {
      const points = [];
      for (let y = -sample * 2; y <= height + sample * 2; y += sample) {
        points.push({ x, y });
      }
      return points;
    }

    function draw(time) {
      animationFrame = 0;
      if (paused) {
        return;
      }

      pointer.x += (target.x - pointer.x) * 0.12;
      pointer.y += (target.y - pointer.y) * 0.12;
      pointer.strength += ((target.active ? 1 : 0.25) - pointer.strength) * 0.08;

      context.clearRect(0, 0, width, height);

      const colors = getThemeColors();
      const radius = Math.min(260, Math.max(170, width * 0.18));
      const strength = pointer.strength;
      const sample = 14;
      const step = 56;
      const drift = (time * 0.004) % step;

      for (let y = -step + drift; y < height + step; y += step) {
        drawWarpedLine(makeHorizontalPoints(y, sample), radius, strength, colors.gridSoft, 0.9);
      }

      for (let x = -step + drift; x < width + step; x += step) {
        drawWarpedLine(makeVerticalPoints(x, sample), radius, strength, colors.gridSoft, 0.9);
      }

      for (let y = -step * 2 + drift; y < height + step * 2; y += step * 2) {
        drawWarpedLine(makeHorizontalPoints(y, sample), radius, strength, colors.grid, 1);
      }

      for (let x = -step * 2 + drift; x < width + step * 2; x += step * 2) {
        drawWarpedLine(makeVerticalPoints(x, sample), radius, strength, colors.grid, 1);
      }

      scheduleFrame();
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);
    window.addEventListener('theme-transition-start', pauseAnimation);
    window.addEventListener('theme-transition-end', resumeAnimation);
    scheduleFrame();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      window.removeEventListener('theme-transition-start', pauseAnimation);
      window.removeEventListener('theme-transition-end', resumeAnimation);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
