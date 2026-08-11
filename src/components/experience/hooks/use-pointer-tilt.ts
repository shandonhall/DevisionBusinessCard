"use client";

import { useCallback, useEffect, useRef } from "react";
import { clamp01 } from "@/lib/experience/resolve";

export type TiltState = {
  rotateX: number;
  rotateY: number;
  px: number;
  py: number;
  lx: number;
  ly: number;
};

const IDLE: TiltState = {
  rotateX: 1.35,
  rotateY: -2.8,
  px: 0.46,
  py: 0.48,
  lx: 0.42,
  ly: 0.32,
};

function writeVars(el: HTMLElement | null, state: TiltState) {
  if (!el) return;
  el.style.setProperty("--dim-rx", state.rotateX.toFixed(3));
  el.style.setProperty("--dim-ry", state.rotateY.toFixed(3));
  el.style.setProperty("--dim-px", state.px.toFixed(4));
  el.style.setProperty("--dim-py", state.py.toFixed(4));
  el.style.setProperty("--dim-lx", state.lx.toFixed(4));
  el.style.setProperty("--dim-ly", state.ly.toFixed(4));
}

/**
 * Pointer tilt + studio light coordinates.
 * Writes CSS custom properties on `rootRef` via rAF - no React state per frame.
 * Light (--dim-lx/ly) tracks pointer with independent lag for specular behaviour.
 */
export function usePointerTilt(options: {
  enabled: boolean;
  strength: number;
  maxDegrees?: number;
  rootRef: React.RefObject<HTMLElement | null>;
}) {
  const maxDegrees = options.maxDegrees ?? 6.5;
  const frame = useRef<number | null>(null);
  const target = useRef<TiltState>(IDLE);
  const current = useRef<TiltState>(IDLE);
  const lightTarget = useRef({ lx: IDLE.lx, ly: IDLE.ly });
  const dragging = useRef(false);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const enabledRef = useRef(options.enabled);
  const visibleRef = useRef(true);

  useEffect(() => {
    enabledRef.current = options.enabled;
    if (!options.enabled) {
      target.current = IDLE;
      lightTarget.current = { lx: IDLE.lx, ly: IDLE.ly };
    }
  }, [options.enabled]);

  useEffect(() => {
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const tiltLerp = 0.11;
    const lightLerp = 0.075;

    const loop = () => {
      if (!visibleRef.current) {
        frame.current = requestAnimationFrame(loop);
        return;
      }

      if (!enabledRef.current) {
        target.current = IDLE;
        lightTarget.current = { lx: IDLE.lx, ly: IDLE.ly };
      }

      const c = current.current;
      const t = target.current;
      const lt = lightTarget.current;

      current.current = {
        rotateX: c.rotateX + (t.rotateX - c.rotateX) * tiltLerp,
        rotateY: c.rotateY + (t.rotateY - c.rotateY) * tiltLerp,
        px: c.px + (t.px - c.px) * tiltLerp,
        py: c.py + (t.py - c.py) * tiltLerp,
        lx: c.lx + (lt.lx - c.lx) * lightLerp,
        ly: c.ly + (lt.ly - c.ly) * lightLerp,
      };

      writeVars(options.rootRef.current, current.current);
      frame.current = requestAnimationFrame(loop);
    };

    writeVars(options.rootRef.current, IDLE);
    frame.current = requestAnimationFrame(loop);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [options.rootRef]);

  const strength = clamp01(options.strength);
  const deg = maxDegrees * strength;

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!options.enabled || dragging.current) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const px = clamp01((event.clientX - rect.left) / rect.width);
      const py = clamp01((event.clientY - rect.top) / rect.height);
      target.current = {
        px,
        py,
        rotateY: (px - 0.5) * 2 * deg,
        rotateX: (0.5 - py) * 2 * deg,
        lx: px,
        ly: py,
      };
      // Softbox sits slightly above pointer for acrylic catch-light.
      lightTarget.current = {
        lx: px * 0.92 + 0.04,
        ly: py * 0.75 + 0.08,
      };
    },
    [deg, options.enabled],
  );

  const onPointerLeave = useCallback(() => {
    if (!dragging.current) {
      target.current = IDLE;
      lightTarget.current = { lx: IDLE.lx, ly: IDLE.ly };
    }
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!options.enabled) return;
      const touch = event.touches[0];
      if (!touch) return;
      dragging.current = true;
      lastTouch.current = { x: touch.clientX, y: touch.clientY };
    },
    [options.enabled],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!options.enabled || !dragging.current || !lastTouch.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dx = (touch.clientX - lastTouch.current.x) / 140;
      const dy = (touch.clientY - lastTouch.current.y) / 140;
      lastTouch.current = { x: touch.clientX, y: touch.clientY };
      const nextY = Math.max(
        -deg,
        Math.min(deg, target.current.rotateY + dx * deg),
      );
      const nextX = Math.max(
        -deg,
        Math.min(deg, target.current.rotateX - dy * deg),
      );
      const px = 0.5 + nextY / (deg * 2 || 1);
      const py = 0.5 - nextX / (deg * 2 || 1);
      target.current = {
        rotateX: nextX,
        rotateY: nextY,
        px,
        py,
        lx: px,
        ly: py,
      };
      lightTarget.current = { lx: px, ly: py * 0.8 + 0.1 };
    },
    [deg, options.enabled],
  );

  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    lastTouch.current = null;
    target.current = IDLE;
    lightTarget.current = { lx: IDLE.lx, ly: IDLE.ly };
  }, []);

  return {
    handlers: {
      onPointerMove,
      onPointerLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
