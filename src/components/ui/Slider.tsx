"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  enabled?: boolean;
  onToggle?: () => void;
  onAdjustStart?: () => void;
  onAdjustEnd?: () => void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  onChange,
  onReset,
  enabled = true,
  onToggle,
  onAdjustStart,
  onAdjustEnd,
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const draggingRef = useRef(false);
  const localValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  localValueRef.current = localValue;

  useEffect(() => {
    if (!draggingRef.current) setLocalValue(value);
  }, [value]);

  const pushLiveUpdate = (next: number) => {
    setLocalValue(next);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onChange(next);
    });
  };

  const finishDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    onChange(localValueRef.current);
    onAdjustEnd?.();
  }, [onChange, onAdjustEnd]);

  useEffect(() => {
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [finishDrag]);

  const isDefault = localValue === defaultValue;
  const pct = ((localValue - min) / (max - min)) * 100;

  return (
    <div style={{ padding: "4px 0", opacity: enabled ? 1 : 0.35 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onToggle && (
            <button
              onClick={onToggle}
              type="button"
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                flexShrink: 0,
                background: enabled ? "var(--color-accent)" : "transparent",
                border: enabled ? "none" : "1px solid var(--color-border)",
              }}
            />
          )}
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            {localValue > 0 ? `+${localValue}` : localValue}
          </span>
          {onReset && !isDefault && (
            <button onClick={onReset} type="button" style={{ fontSize: 10, color: "var(--color-accent)" }}>
              Reset
            </button>
          )}
        </div>
      </div>
      <div className="lr-slider-track" style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: "var(--color-surface-input)", borderRadius: 2 }} />
        <div
          className="lr-slider-fill"
          style={{
            position: "absolute",
            left: 0,
            width: `${pct}%`,
            height: 4,
            background: "var(--color-accent)",
            borderRadius: 2,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          disabled={!enabled}
          onPointerDown={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
            onAdjustStart?.();
          }}
          onInput={(e) => pushLiveUpdate(Number(e.currentTarget.value))}
          style={{ width: "100%", position: "relative", zIndex: 1, touchAction: "none" }}
        />
      </div>
    </div>
  );
}
