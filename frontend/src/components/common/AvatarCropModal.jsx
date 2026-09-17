import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MagnifyingGlassMinus, MagnifyingGlassPlus, Check } from '@phosphor-icons/react';

/**
 * AvatarCropModal
 * Props:
 *   imageSrc   – data URL of the selected image
 *   onConfirm  – (webpDataUrl: string) => void
 *   onCancel   – () => void
 */
export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  // Crop state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const lastOffset = useRef({ x: 0, y: 0 });

  const CANVAS_SIZE = 300; // display canvas px
  const OUTPUT_SIZE = 256; // exported avatar px

  // Lock body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Minimum scale required so image covers the canvas completely without white gaps
  const getMinZoom = useCallback(() => {
    const img = imgRef.current;
    if (!img) return 1;
    return Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
  }, []);

  // Clamp pan offset so image edges never pull inside the canvas frame
  const clampOffset = useCallback((newOffset, currentZoom) => {
    const img = imgRef.current;
    if (!img) return { x: 0, y: 0 };
    const minZoom = getMinZoom();
    const activeZoom = Math.max(minZoom, currentZoom);
    const maxOffsetX = Math.max(0, (img.width * activeZoom - CANVAS_SIZE) / 2);
    const maxOffsetY = Math.max(0, (img.height * activeZoom - CANVAS_SIZE) / 2);
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, newOffset.x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, newOffset.y)),
    };
  }, [getMinZoom]);

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const initialMinZoom = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      setZoom(initialMinZoom);
      setOffset({ x: 0, y: 0 });
      lastOffset.current = { x: 0, y: 0 };
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw canvas whenever zoom/offset changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const minZoom = getMinZoom();
    const activeZoom = Math.max(minZoom, zoom);
    const clamped = clampOffset(offset, activeZoom);

    const w = img.width * activeZoom;
    const h = img.height * activeZoom;
    const x = CANVAS_SIZE / 2 - w / 2 + clamped.x;
    const y = CANVAS_SIZE / 2 - h / 2 + clamped.y;

    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [zoom, offset, getMinZoom, clampOffset]);

  useEffect(() => { draw(); }, [draw]);

  // Non-passive wheel event listener to completely block page scroll when zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setZoom((z) => {
        const minZ = getMinZoom();
        const nextZ = Math.min(minZ * 4, Math.max(minZ, z - e.deltaY * 0.0015));
        setOffset((prev) => clampOffset(prev, nextZ));
        return nextZ;
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [getMinZoom, clampOffset]);

  // Mouse drag
  const onMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const rawOffset = { x: lastOffset.current.x + dx, y: lastOffset.current.y + dy };
    setOffset(clampOffset(rawOffset, zoom));
  };
  const onMouseUp = () => {
    setIsDragging(false);
    lastOffset.current = clampOffset(offset, zoom);
  };

  // Touch drag
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 1 && dragStart.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      const rawOffset = { x: lastOffset.current.x + dx, y: lastOffset.current.y + dy };
      setOffset(clampOffset(rawOffset, zoom));
    }
  };
  const onTouchEnd = () => {
    lastOffset.current = clampOffset(offset, zoom);
  };

  // Scroll to zoom
  const onWheel = (e) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(0.3, z - e.deltaY * 0.001)));
  };

  // Export cropped circle as 256×256 WebP
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement('canvas');
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext('2d');

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = OUTPUT_SIZE / CANVAS_SIZE;
    const w = img.width * zoom * scale;
    const h = img.height * zoom * scale;
    const x = OUTPUT_SIZE / 2 - w / 2 + offset.x * scale;
    const y = OUTPUT_SIZE / 2 - h / 2 + offset.y * scale;
    ctx.drawImage(img, x, y, w, h);

    onConfirm(out.toDataURL('image/webp', 0.85));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative flex flex-col items-center gap-5 rounded-2xl bg-white p-6 shadow-2xl w-full max-w-sm border border-slate-100">
        {/* Header */}
        <div className="flex w-full items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Crop Profile Photo</h3>
            <p className="text-xs text-slate-500 mt-0.5">Drag photo to align • Scroll to zoom</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas area */}
        <div
          className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing border-2 border-slate-200 shadow-inner bg-slate-50"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          onMouseLeave={onMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ borderRadius: '50%', display: 'block' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex w-full items-center gap-3 px-1 text-slate-500">
          <button
            type="button"
            onClick={() => {
              const minZ = getMinZoom();
              setZoom((z) => {
                const nextZ = Math.max(minZ, z - 0.15);
                setOffset((prev) => clampOffset(prev, nextZ));
                return nextZ;
              });
            }}
            className="hover:text-slate-800 transition-colors"
            title="Zoom out"
          >
            <MagnifyingGlassMinus size={18} />
          </button>
          <input
            type="range"
            min={getMinZoom()}
            max={getMinZoom() * 4}
            step="0.01"
            value={Math.max(getMinZoom(), zoom)}
            onChange={(e) => {
              const nextZ = parseFloat(e.target.value);
              setZoom(nextZ);
              setOffset((prev) => clampOffset(prev, nextZ));
            }}
            className="flex-1 accent-brand-blue cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
          <button
            type="button"
            onClick={() => {
              const minZ = getMinZoom();
              setZoom((z) => {
                const nextZ = Math.min(minZ * 4, z + 0.15);
                setOffset((prev) => clampOffset(prev, nextZ));
                return nextZ;
              });
            }}
            className="hover:text-slate-800 transition-colors"
            title="Zoom in"
          >
            <MagnifyingGlassPlus size={18} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex w-full gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Check size={16} weight="bold" />
            Save Photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
