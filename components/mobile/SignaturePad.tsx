'use client';

import { useState, useRef, useEffect } from 'react';

interface SignaturePadProps {
  workOrderId: string;
  onSave?: (signatureUrl: string) => void;
}

export default function SignaturePad({ workOrderId, onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    try {
      setSaving(true);
      const dataUrl = canvas.toDataURL('image/png');

      const response = await fetch(`/api/work-orders/${workOrderId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'signature',
          file_url: dataUrl,
          file_name: 'signature.png',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (onSave && result.data?.[0]?.file_url) {
          onSave(result.data[0].file_url);
        }
      }
    } catch (error) {
      console.error('Error saving signature:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Firma del Responsable</h3>
      <div className="border-2 border-gray-300 rounded bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full touch-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={clear}
          className="px-4 py-2 border rounded text-sm"
        >
          Limpiar
        </button>
        <button
          onClick={save}
          disabled={!hasSignature || saving}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Firma'}
        </button>
      </div>
    </div>
  );
}

