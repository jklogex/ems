'use client';

import { useState, useRef } from 'react';

interface PhotoCaptureProps {
  workOrderId: string;
  type: 'photo_before' | 'photo_after';
  onCapture?: (fileUrl: string) => void;
}

export default function PhotoCapture({ workOrderId, type, onCapture }: PhotoCaptureProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // In a real implementation, upload to cloud storage
      // For now, we'll use a placeholder
      const response = await fetch(`/api/work-orders/${workOrderId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          file_url: URL.createObjectURL(file), // Placeholder
          file_name: file.name,
          file_size: file.size,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (onCapture && result.data?.[0]?.file_url) {
          onCapture(result.data[0].file_url);
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {type === 'photo_before' ? 'Foto Antes' : 'Foto Después'}
        </h3>
        <button
          onClick={handleCapture}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Tomar Foto'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {photo && (
        <div className="mt-4">
          <img
            src={photo}
            alt={type}
            className="w-full h-64 object-cover rounded border"
          />
        </div>
      )}
    </div>
  );
}

