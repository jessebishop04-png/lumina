"use client";

import { useEffect, useState } from "react";
import { EXPORT_PRESETS } from "@/lib/constants/exportPresets";
import { downloadBlob, exportImage, renderAdjustedImageForExport } from "@/lib/image/imageProcessor";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function ExportModal() {
  const showExportModal = useEditorStore((s) => s.showExportModal);
  const setShowExportModal = useEditorStore((s) => s.setShowExportModal);
  const exportSettings = useEditorStore((s) => s.exportSettings);
  const setExportSettings = useEditorStore((s) => s.setExportSettings);
  const activeImage = useActiveImage();
  const project = useEditorStore((s) => s.project);

  const [isExporting, setIsExporting] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!activeImage) return;
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      if (!exportSettings.width && !exportSettings.height) {
        setExportSettings({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    };
    img.src = activeImage.originalDataUrl;
  }, [activeImage, exportSettings.width, exportSettings.height, setExportSettings]);

  const handlePresetChange = (presetId: string) => {
    const preset = EXPORT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setExportSettings({
      preset: preset.id,
      format: preset.format,
      quality: preset.quality,
      width: preset.width || naturalSize.width,
      height: preset.height || naturalSize.height,
    });
  };

  const handleExport = async () => {
    if (!activeImage) return;
    setIsExporting(true);

    try {
      const adjustedUrl = await renderAdjustedImageForExport(
        activeImage.originalDataUrl,
        activeImage.edits,
        activeImage.enabledEdits,
        {
          rotation: activeImage.rotation,
          crop: activeImage.crop,
          maskDataUrl: activeImage.maskDataUrl,
        }
      );

      const blob = await exportImage(
        adjustedUrl,
        exportSettings.format,
        exportSettings.quality,
        exportSettings.width,
        exportSettings.height,
        exportSettings.maintainAspectRatio
      );

      const ext = exportSettings.format === "jpeg" ? "jpg" : exportSettings.format;
      downloadBlob(blob, `${exportSettings.filename}.${ext}`);
      setShowExportModal(false);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      title="Export Image"
      size="md"
    >
      <div className="space-y-5">
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">
            Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  exportSettings.preset === preset.id
                    ? "border-accent bg-surface-hover"
                    : "border-border hover:border-text-muted"
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{preset.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Filename"
          value={exportSettings.filename}
          onChange={(e) => setExportSettings({ filename: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">
              Format
            </label>
            <select
              value={exportSettings.format}
              onChange={(e) =>
                setExportSettings({
                  format: e.target.value as "jpeg" | "png" | "webp",
                  preset: "custom",
                })
              }
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          {exportSettings.format !== "png" && (
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">
                Quality · {exportSettings.quality}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={exportSettings.quality}
                onChange={(e) =>
                  setExportSettings({ quality: Number(e.target.value), preset: "custom" })
                }
                className="w-full mt-2"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Width (px)"
            type="number"
            value={exportSettings.width || ""}
            onChange={(e) =>
              setExportSettings({
                width: Number(e.target.value),
                preset: "custom",
              })
            }
          />
          <Input
            label="Height (px)"
            type="number"
            value={exportSettings.height || ""}
            onChange={(e) =>
              setExportSettings({
                height: Number(e.target.value),
                preset: "custom",
              })
            }
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={exportSettings.maintainAspectRatio}
            onChange={(e) =>
              setExportSettings({ maintainAspectRatio: e.target.checked })
            }
            className="w-4 h-4 rounded accent-accent"
          />
          <span className="text-sm text-text-secondary">Maintain aspect ratio</span>
        </label>

        {naturalSize.width > 0 && (
          <p className="text-xs text-text-muted">
            Original: {naturalSize.width} × {naturalSize.height}px
            {project?.name && ` · ${project.name}`}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowExportModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="ig"
            className="flex-1"
            onClick={handleExport}
            disabled={isExporting || !activeImage}
          >
            {isExporting ? "Exporting..." : "Download"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
