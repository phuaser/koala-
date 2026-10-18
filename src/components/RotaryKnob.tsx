import React, { useRef, useState, useEffect } from 'react';

interface RotaryKnobProps {
  label: string;
  value: number; // current value
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  displayValue?: string;
  onChange: (value: number) => void;
  size?: number; // diameter in pixels (default 68)
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  defaultValue = 0,
  unit = '',
  displayValue,
  onChange,
  size = 68,
}) => {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(value);

  // Normalize value from 0 to 1
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Angle: -135deg to +135deg (total 270deg rotation)
  const angle = -135 + normalized * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartVal.current = value;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = dragStartY.current - e.clientY; // positive = dragging up
    const range = max - min;
    const sensitivity = range / 140; // 140px drag for full range
    let newVal = dragStartVal.current + deltaY * sensitivity;

    if (step) {
      newVal = Math.round(newVal / step) * step;
    }
    newVal = Math.max(min, Math.min(max, newVal));
    onChange(Number(newVal.toFixed(2)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  return (
    <div className="flex flex-col items-center select-none group">
      {/* Rotary Dial */}
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        title={`หมุนหรือลากขึ้น/ลงเพื่อปรับ ${label} (ดับเบิลคลิกเพื่อรีเซ็ต)`}
        className="relative rounded-full cursor-ns-resize shadow-lg flex items-center justify-center transition-transform active:scale-95"
        style={{
          width: size,
          height: size,
          background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e8f0 70%, #cbd5e1 100%)',
          border: '2px solid rgba(0, 210, 255, 0.4)',
          boxShadow: isDragging
            ? '0 0 16px rgba(0, 210, 255, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.8)'
            : '0 4px 10px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
        }}
      >
        {/* Pointer indicator line / dot */}
        <div
          className="absolute w-full h-full pointer-events-none transition-transform duration-75"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
        >
          <div className="w-1.5 h-3.5 bg-[#e11d48] rounded-full mx-auto mt-1 shadow-sm" />
        </div>

        {/* Center label */}
        <span className="text-[10px] font-bold tracking-wider text-slate-800 uppercase pointer-events-none">
          {label}
        </span>
      </div>

      {/* Value Readout */}
      <span className="mt-1 font-mono-numbers text-[10px] font-semibold text-[#00d2ff] tracking-tight">
        {displayValue ?? `${value}${unit}`}
      </span>
    </div>
  );
};
