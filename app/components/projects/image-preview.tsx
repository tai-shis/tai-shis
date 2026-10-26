"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";

export interface PreviewImage {
  src: string;
  alt: string;
}

interface ImagePreviewProps {
  images: PreviewImage[];
}

export default function ImagePreview({ images }: ImagePreviewProps) {
  const [selected, setSelected] = useState<PreviewImage | null>(null);
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState("center");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      dialogRef.current?.close();
      setSelected(null);
      setClosing(false);
    }, 240);
  };

  const handleOpen = (image: PreviewImage, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (rect.left + rect.width / 2) - window.innerWidth / 2;
    const dy = (rect.top + rect.height / 2) - window.innerHeight / 2;
    setOrigin(`calc(50% + ${dx}px) calc(50% + ${dy}px)`);
    setSelected(image);
    setClosing(false);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
  }, [selected]);

  return (
    <>
      <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar">
        {images.map((image) => (
          <button
            key={image.src}
            onClick={(e) => handleOpen(image, e)}
            aria-label={`Enlarge: ${image.alt}`}
            className="relative shrink-0 h-20 w-32 overflow-hidden border border-border hover:border-border-accent transition-colors cursor-pointer"
          >
            <Image src={image.src} alt="" fill sizes="128px" className="object-cover" />
          </button>
        ))}
      </div>

      {selected && createPortal(
        <dialog
          ref={dialogRef}
          aria-label={selected.alt}
          onCancel={(e) => { e.preventDefault(); close(); }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          style={{ borderRadius: 0 }}
          className="fixed inset-0 m-0 h-screen w-screen max-h-none max-w-none p-0 border-0 bg-background/90 backdrop:bg-transparent overscroll-contain open:flex items-center justify-center"
        >
          <button
            onClick={close}
            aria-label="Close image"
            className="absolute top-4 right-4 tui-panel p-2 text-muted hover:text-accent hover:border-border-accent transition-colors cursor-pointer"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div
            style={{ transformOrigin: origin }}
            className={`tui-panel border-border-accent overflow-hidden ${closing ? "animate-zoom-out" : "animate-zoom-in"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.src}
              alt={selected.alt}
              className="max-w-[90vw] max-h-[90vh] object-contain block"
            />
          </div>
        </dialog>,
        document.body
      )}
    </>
  );
}
