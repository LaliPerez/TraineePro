
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  className?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f8fafc';

    if (e.type === 'mousedown' || e.type === 'touchstart') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
      if (onClear) onClear();
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="signature-pad w-full rounded-lg touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={clear}
        className="text-xs text-red-400 hover:text-red-300 self-end px-2 py-1"
      >
        Limpiar Firma
      </button>
    </div>
  );
};

export default SignaturePad;
