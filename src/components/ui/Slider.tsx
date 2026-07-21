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
  variant?: "default" | "lr";
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
  variant = "default",
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const draggingRef = useRef(false);
  const localValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const isLr = variant === "lr";

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
  const displayValue = localValue > 0 ? `+${localValue}` : `${localValue}`;

  return (
    <div className={isLr ? "lr-adjust-row" : undefined} style={{ padding: isLr ? "6px 0" : "4px 0", opacity: enabled ? 1 : 0.35 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: isLr ? 8 : 6,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isLr && onToggle && (
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
          <span className={isLr ? "lr-adjust-label" : undefined} style={isLr ? undefined : { fontSize: 11, color: "var(--color-text-secondary)" }}>
            {label}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            className={isLr ? "lr-adjust-value" : undefined}
            style={isLr ? undefined : { fontSize: 11, color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}
          >
            {displayValue}
          </span>
          {!isLr && onReset && !isDefault && (
            <button onClick={onReset} type="button" style={{ fontSize: 10, color: "var(--color-accent)" }}>
              Reset
            </button>
          )}
        </div>
      </div>
      <div
        className={isLr ? "lr-slider-track lr-slider-track--panel" : "lr-slider-track"}
        style={{ position: "relative", height: isLr ? 24 : 20, display: "flex", alignItems: "center" }}
      >
        <div
          style={{
            position: "absolute",
            left: isLr ? 8 : 0,
            right: isLr ? 8 : 0,
            height: isLr ? 4 : 4,
            background: isLr ? "#4A4A4A" : "var(--color-surface-input)",
            borderRadius: 2,
          }}
        />
        <div
          className="lr-slider-fill"
          style={{
            position: "absolute",
            left: isLr ? 8 : 0,
            width: isLr ? `calc((100% - 16px) * ${pct / 100})` : `${pct}%`,
            height: 4,
            background: isLr ? "#F2F2F2" : "var(--color-accent)",
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
          className={isLr ? "lr-range lr-range--panel" : undefined}
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
