"use client";

import { useCallback, useRef, useState } from "react";
import { createReferenceImage, fileToDataUrl } from "@/lib/image/imageProcessor";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.includes(file.type) || file.type.startsWith("image/");
}

export async function prepareReferenceImage(file: File): Promise<string> {
  if (!isImageFile(file)) throw new Error("Please drop an image file (JPEG, PNG, WebP, or GIF)");
  const dataUrl = await fileToDataUrl(file);
  return createReferenceImage(dataUrl, 1024);
}

export function useImageDrop(onImage: (dataUrl: string) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      try {
        const dataUrl = await prepareReferenceImage(file);
        onImage(dataUrl);
      } catch (err) {
        console.error(err);
      }
    },
    [onImage]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      try {
        const dataUrl = await prepareReferenceImage(file);
        onImage(dataUrl);
      } catch (err) {
        console.error(err);
      }
    },
    [onImage]
  );

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    handleFileInput,
  };
}