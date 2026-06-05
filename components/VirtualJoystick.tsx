"use client";

import { useCallback, useRef } from "react";

export type StickVector = { x: number; y: number };

type Props = {
  onChange: (v: StickVector) => void;
  disabled?: boolean;
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
};

const OUTER = 96;
const KNOB = 40;
const MAX_RADIUS = (OUTER - KNOB) / 2;
const DEAD_ZONE = 0.12;

function clampKnob(dx: number, dy: number) {
  const dist = Math.hypot(dx, dy);
  if (dist <= MAX_RADIUS) return { dx, dy, nx: dx / MAX_RADIUS, ny: dy / MAX_RADIUS };
  const s = MAX_RADIUS / dist;
  return { dx: dx * s, dy: dy * s, nx: (dx / dist), ny: (dy / dist) };
}

function toStick(nx: number, ny: number): StickVector {
  const mag = Math.hypot(nx, ny);
  if (mag < DEAD_ZONE) return { x: 0, y: 0 };
  const scale = Math.min(1, (mag - DEAD_ZONE) / (1 - DEAD_ZONE));
  return {
    x: (nx / mag) * scale,
    y: (ny / mag) * scale,
  };
}

export function VirtualJoystick({
  onChange,
  disabled = false,
  className = "",
  label = "이동 조이스틱",
}: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const knobRef = useRef({ dx: 0, dy: 0 });

  const reset = useCallback(() => {
    pointerIdRef.current = null;
    knobRef.current = { dx: 0, dy: 0 };
    onChange({ x: 0, y: 0 });
    const knob = baseRef.current?.querySelector<HTMLElement>("[data-knob]");
    if (knob) {
      knob.style.transform = "translate(-50%, -50%)";
    }
  }, [onChange]);

  const applyKnob = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawDx = clientX - cx;
      const rawDy = clientY - cy;
      const { dx, dy, nx, ny } = clampKnob(rawDx, rawDy);
      knobRef.current = { dx, dy };
      const knob = base.querySelector<HTMLElement>("[data-knob]");
      if (knob) {
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }
      onChange(toStick(nx, ny));
    },
    [onChange],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    applyKnob(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    applyKnob(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    reset();
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label={label}
      className={`touch-none select-none ${className}`}
      style={{ width: OUTER, height: OUTER }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={`absolute inset-0 rounded-full border-2 shadow-inner transition-opacity ${
          disabled
            ? "border-slate-600/30 bg-slate-900/20 opacity-40"
            : "border-cyan-500/35 bg-[#030812]/55 backdrop-blur-sm"
        }`}
        aria-hidden
      />
      <div
        data-knob
        className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full border-2 shadow-lg transition-[box-shadow] ${
          disabled
            ? "border-slate-500/40 bg-slate-700/60"
            : "border-cyan-400/60 bg-cyan-500/25 shadow-cyan-500/20"
        }`}
        style={{
          width: KNOB,
          height: KNOB,
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden
      />
    </div>
  );
}
