import { useEffect, useRef } from 'react';

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function percentToPixel(value, total) {
  return (Number(String(value).replace('%', '')) / 100) * total;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function InteractiveMathTokens({ tokens = [] }) {
  const tokenRefs = useRef([]);

  useEffect(() => {
    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      active: false,
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const states = tokens.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    let animationFrame = 0;
    let previousTime = performance.now();
    let paused = false;

    function scheduleFrame() {
      if (!paused && !animationFrame) animationFrame = window.requestAnimationFrame(draw);
    }

    function syncViewport() {
      pointer.width = window.innerWidth;
      pointer.height = window.innerHeight;
    }

    function handlePointerMove(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
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
      previousTime = performance.now();
      scheduleFrame();
    }

    function draw(time) {
      animationFrame = 0;
      if (paused) {
        return;
      }

      const dt = Math.min(2, Math.max(0.5, (time - previousTime) / 16.67));
      previousTime = time;

      tokens.forEach((token, index) => {
        const element = tokenRefs.current[index];
        const state = states[index];
        if (!element || !state) return;

        const baseX = percentToPixel(token.left, pointer.width);
        const baseY = percentToPixel(token.top, pointer.height);
        const dx = pointer.x - baseX;
        const dy = pointer.y - baseY;
        const distance = Math.hypot(dx, dy) || 1;
        const radius = token.small ? 200 : 260;
        const influence = pointer.active ? smoothstep(1 - distance / radius) : 0;
        const maxPull = token.small ? 34 : 54;
        const pullRatio = Math.min(0.3 * influence, maxPull / distance);
        const targetX = dx * pullRatio;
        const targetY = dy * pullRatio;

        // Damped spring: tokens chase a cursor-driven equilibrium, then settle back to origin.
        state.vx += (targetX - state.x) * 0.06 * dt;
        state.vy += (targetY - state.y) * 0.06 * dt;
        state.vx *= Math.pow(0.82, dt);
        state.vy *= Math.pow(0.82, dt);
        state.vx = clamp(state.vx, -8, 8);
        state.vy = clamp(state.vy, -8, 8);
        state.x = clamp(state.x + state.vx * dt, -maxPull, maxPull);
        state.y = clamp(state.y + state.vy * dt, -maxPull, maxPull);

        element.style.setProperty('--pull-x', `${state.x.toFixed(2)}px`);
        element.style.setProperty('--pull-y', `${state.y.toFixed(2)}px`);
      });

      scheduleFrame();
    }

    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);
    window.addEventListener('theme-transition-start', pauseAnimation);
    window.addEventListener('theme-transition-end', resumeAnimation);
    scheduleFrame();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      window.removeEventListener('theme-transition-start', pauseAnimation);
      window.removeEventListener('theme-transition-end', resumeAnimation);
    };
  }, [tokens]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {tokens.map((token, index) => (
        <span
          key={`${token.text}-${token.left}-${token.top}`}
          ref={(element) => {
            tokenRefs.current[index] = element;
          }}
          className={`auth-token ${token.small ? 'auth-token-sm' : ''}`}
          style={{
            left: token.left,
            top: token.top,
            '--x': token.x,
            '--y': token.y,
            '--rotate': token.rotate,
            '--pull-x': '0px',
            '--pull-y': '0px',
            animationDelay: token.delay,
          }}
        >
          {token.text}
        </span>
      ))}
    </div>
  );
}
