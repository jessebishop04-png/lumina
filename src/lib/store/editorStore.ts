import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  AdjustmentKey,
  CanvasViewState,
  CropRect,
  EditAdjustments,
  ExportSettings,
  Project,
  ProjectImage,
} from "@/lib/types";
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CROP,
  createEnabledEdits,
} from "@/lib/types";
import type { StudioTool, StudioCanvasState } from "@/lib/types/studio";
import { DEFAULT_STUDIO_STATE, getStudioDimensions } from "@/lib/types/studio";
import type { ImagineEditState } from "@/lib/types/generation";
import { DEFAULT_IMAGINE_STATE } from "@/lib/types/generation";
import { buildStudioComposite } from "@/lib/image/studioCanvas";
import { normalizeEdits } from "@/lib/constants/adjustments";
import {
  createImageThumbnails,
  createLibraryPreview,
  createReferenceImage,
  ensureDataUrl,
  fileToDataUrl,
  loadImageFromDataUrl,
  resetAdjustments,
} from "@/lib/image/imageProcessor";
import {
  addRecentProject,
  deleteProject as deleteStoredProject,
  getProject,
  getProjectSummaries,
  saveProject,
} from "@/lib/storage/projectStorage";
import { publishToExplore } from "@/lib/explore/publishToExplore";
import { notifyExploreNewPost } from "@/lib/store/exploreStore";
import type { ProjectSummary } from "@/lib/types";

export type EditorModule = "edit" | "crop";

interface EditorState {
  project: Project | null;
  recentProjects: ProjectSummary[];
  isLoading: boolean;
  showBefore: boolean;
  showExportModal: boolean;
  editorModule: EditorModule;
  activePanel: "light" | "color" | "detail" | "suggestions";
  canvasView: CanvasViewState;
  exportSettings: ExportSettings;
  processedImageUrl: string | null;
  isProcessing: boolean;
  isAdjusting: boolean;
  adjustingCount: number;
  maskBrushSize: number;
  maskBrushMode: "paint" | "erase";
  studioTool: StudioTool;
  studioBrushSize: number;
  studioTab: "edit" | "retexture";
  studioGenerating: boolean;
  imagineGenerating: boolean;
  imagineSourceImageId: string | null;
  imagineSourceImageName: string | null;
  imagineError: string | null;

  loadRecentProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProjectFromFile: (file: File) => Promise<string>;
  createProjectFromDataUrl: (dataUrl: string, name?: string) => Promise<string>;
  createEmptyProject: (name?: string) => Promise<string>;
  addImageToProject: (file: File) => Promise<void>;
  setActiveImage: (imageId: string) => void;
  updateAdjustment: (key: AdjustmentKey, value: number) => void;
  toggleAdjustment: (key: AdjustmentKey) => void;
  resetAdjustment: (key: AdjustmentKey) => void;
  resetAllAdjustments: () => void;
  applySuggestion: (adjustments: Partial<EditAdjustments>) => void;
  rotateImage: (degrees: number) => void;
  setCrop: (crop: CropRect) => void;
  resetCrop: () => void;
  setMaskDataUrl: (maskDataUrl: string | null) => void;
  clearMask: () => void;
  setMaskBrushSize: (size: number) => void;
  setMaskBrushMode: (mode: "paint" | "erase") => void;
  setStudioTool: (tool: StudioTool) => void;
  setStudioBrushSize: (size: number) => void;
  setStudioTab: (tab: "edit" | "retexture") => void;
  updateStudioState: (partial: Partial<StudioCanvasState>) => void;
  resetStudioCanvas: () => void;
  submitStudioEdit: () => Promise<void>;
  applyStudioResult: (url: string) => Promise<void>;
  updateImagineState: (partial: Partial<Omit<ImagineEditState, "settings">> & { settings?: Partial<ImagineEditState["settings"]> }) => void;
  toggleImagineStyle: (styleId: string) => void;
  submitImagineVersions: (count?: number) => Promise<void>;
  applyImagineResult: (url: string) => Promise<void>;
  addImagineResultAsNewPhoto: (url: string) => Promise<void>;
  renameProject: (name: string) => void;
  renameImage: (imageId: string, name: string) => void;
  deleteProjectById: (id: string) => Promise<void>;
  setShowBefore: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setEditorModule: (module: EditorModule) => void;
  setActivePanel: (panel: "light" | "color" | "detail" | "suggestions") => void;
  setCanvasView: (view: Partial<CanvasViewState>) => void;
  setExportSettings: (settings: Partial<ExportSettings>) => void;
  setProcessedImageUrl: (url: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  beginAdjusting: () => void;
  endAdjusting: () => void;
  persistProject: () => Promise<void>;
}

function defaultImagineState(): ImagineEditState {
  return {
    ...DEFAULT_IMAGINE_STATE,
    settings: { ...DEFAULT_IMAGINE_STATE.settings },
  };
}

function insertImagesAfter(
  images: ProjectImage[],
  afterImageId: string,
  newImages: ProjectImage[]
): ProjectImage[] {
  const index = images.findIndex((img) => img.id === afterImageId);
  if (index === -1) return [...images, ...newImages];
  return [...images.slice(0, index + 1), ...newImages, ...images.slice(index + 1)];
}

/** Build img2img reference from preview/thumbnail — avoids resizing multi‑MB originals from uploads. */
async function resolveReferenceForGeneration(image: ProjectImage): Promise<string> {
  if (image.referenceMediaUrl?.startsWith("http")) {
    return image.referenceMediaUrl;
  }

  const source =
    image.previewDataUrl ??
    image.thumbnailDataUrl ??
    image.originalDataUrl;

  if (!source) {
    throw new Error("This photo has no image data — try re-adding it to the project.");
  }

  return createReferenceImage(source, 768);
}

async function createProjectImageFromUrl(name: string, url: string): Promise<ProjectImage> {
  const dataUrl = await ensureDataUrl(url);
  const { thumbnailDataUrl, previewDataUrl } = await createImageThumbnails(dataUrl);
  return createProjectImage(name, dataUrl, thumbnailDataUrl, previewDataUrl);
}

function createProjectImage(
  name: string,
  originalDataUrl: string,
  thumbnailDataUrl: string,
  previewDataUrl: string
): ProjectImage {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name,
    originalDataUrl,
    thumbnailDataUrl,
    previewDataUrl,
    edits: resetAdjustments(),
    enabledEdits: createEnabledEdits(),
    rotation: 0,
    crop: { ...DEFAULT_CROP },
    maskDataUrl: null,
    imagine: defaultImagineState(),
    imagineResults: [],
    referenceMediaUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeProjectImage(img: ProjectImage): ProjectImage {
  return {
    ...img,
    edits: normalizeEdits(img.edits ?? {}),
    enabledEdits: { ...createEnabledEdits(), ...img.enabledEdits },
    rotation: img.rotation ?? 0,
    crop: img.crop ?? { ...DEFAULT_CROP },
    maskDataUrl: img.maskDataUrl ?? null,
    studio: img.studio ?? { ...DEFAULT_STUDIO_STATE },
    studioResults: img.studioResults ?? [],
    imagine: img.imagine ?? defaultImagineState(),
    imagineResults: img.imagineResults ?? [],
    previewDataUrl: img.previewDataUrl ?? img.thumbnailDataUrl ?? undefined,
    referenceMediaUrl: img.referenceMediaUrl ?? null,
  };
}

function normalizeProject(project: Project): Project {
  return {
    ...project,
    images: project.images.map(normalizeProjectImage),
  };
}

function getActiveImage(project: Project | null): ProjectImage | null {
  if (!project || !project.activeImageId) return null;
  return project.images.find((img) => img.id === project.activeImageId) ?? null;
}

const defaultExportSettings: ExportSettings = {
  filename: "edited-image",
  format: "jpeg",
  quality: 90,
  width: 0,
  height: 0,
  maintainAspectRatio: true,
  preset: "custom",
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  recentProjects: [],
  isLoading: false,
  showBefore: false,
  showExportModal: false,
  editorModule: "edit",
  activePanel: "light",
  canvasView: { zoom: 1, panX: 0, panY: 0, fitToScreen: true },
  exportSettings: defaultExportSettings,
  processedImageUrl: null,
  isProcessing: false,
  isAdjusting: false,
  adjustingCount: 0,
  maskBrushSize: 24,
  maskBrushMode: "paint",
  studioTool: "move",
  studioBrushSize: 32,
  studioTab: "edit",
  studioGenerating: false,
  imagineGenerating: false,
  imagineSourceImageId: null,
  imagineSourceImageName: null,
  imagineError: null,

  loadRecentProjects: async () => {
    let summaries = await getProjectSummaries();
    const stale = summaries.filter((s) => !s.previewDataUrl && s.thumbnailDataUrl);

    if (stale.length > 0) {
      await Promise.all(
        stale.map(async (summary) => {
          const project = await getProject(summary.id);
          const first = project?.images[0];
          if (!project || !first?.originalDataUrl) return;

          const previewDataUrl = await createLibraryPreview(first.originalDataUrl);
          const updatedProject: Project = {
            ...project,
            images: project.images.map((img, index) =>
              index === 0 ? { ...img, previewDataUrl } : img
            ),
          };
          await saveProject(updatedProject);
        })
      );
      summaries = await getProjectSummaries();
    }

    set({ recentProjects: summaries });
  },

  loadProject: async (id: string) => {
    set({ isLoading: true });
    const raw = await getProject(id);
    const project = raw ? normalizeProject(raw) : null;
    if (project) {
      addRecentProject(id);
      set({
        project,
        isLoading: false,
        processedImageUrl: null,
        canvasView: { zoom: 1, panX: 0, panY: 0, fitToScreen: true },
      });
    } else {
      set({ isLoading: false });
    }
  },

  createProjectFromFile: async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const { thumbnailDataUrl, previewDataUrl } = await createImageThumbnails(dataUrl);
    const image = createProjectImage(file.name, dataUrl, thumbnailDataUrl, previewDataUrl);
    const now = new Date().toISOString();
    const projectName = file.name.replace(/\.[^.]+$/, "") || "Untitled Project";

    const project: Project = {
      id: uuidv4(),
      name: projectName,
      createdAt: now,
      updatedAt: now,
      images: [image],
      activeImageId: image.id,
    };

    await saveProject(project);
    addRecentProject(project.id);
    set({
      project,
      processedImageUrl: null,
      canvasView: { zoom: 1, panX: 0, panY: 0, fitToScreen: true },
      exportSettings: { ...defaultExportSettings, filename: projectName },
    });

    const projects = await getProjectSummaries();
    set({ recentProjects: projects });

    return project.id;
  },

  createProjectFromDataUrl: async (dataUrl: string, name = "AI Generation") => {
    const { thumbnailDataUrl, previewDataUrl } = await createImageThumbnails(dataUrl);
    const image = createProjectImage(`${name}.png`, dataUrl, thumbnailDataUrl, previewDataUrl);
    const now = new Date().toISOString();

    const project: Project = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
      images: [image],
      activeImageId: image.id,
    };

    await saveProject(project);
    addRecentProject(project.id);

    const projects = await getProjectSummaries();
    set({ recentProjects: projects });

    return project.id;
  },

  createEmptyProject: async (name = "Untitled Project") => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
      images: [],
      activeImageId: null,
    };

    await saveProject(project);
    addRecentProject(project.id);
    set({ project, processedImageUrl: null });

    const projects = await getProjectSummaries();
    set({ recentProjects: projects });

    return project.id;
  },

  addImageToProject: async (file: File) => {
    const { project, persistProject } = get();
    if (!project) return;

    const dataUrl = await fileToDataUrl(file);
    const { thumbnailDataUrl, previewDataUrl } = await createImageThumbnails(dataUrl);
    const image = createProjectImage(file.name, dataUrl, thumbnailDataUrl, previewDataUrl);

    set({
      project: {
        ...project,
        images: [...project.images, image],
        activeImageId: image.id,
        updatedAt: new Date().toISOString(),
      },
      processedImageUrl: null,
    });

    await persistProject();
  },

  setActiveImage: (imageId: string) => {
    const { project } = get();
    if (!project) return;
    set({
      project: { ...project, activeImageId: imageId },
      processedImageUrl: null,
      canvasView: { zoom: 1, panX: 0, panY: 0, fitToScreen: true },
    });
  },

  updateAdjustment: (key: AdjustmentKey, value: number) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? {
            ...img,
            edits: { ...img.edits, [key]: value },
            updatedAt: new Date().toISOString(),
          }
        : img
    );

    set({
      project: {
        ...project,
        images: updatedImages,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  toggleAdjustment: (key: AdjustmentKey) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? {
            ...img,
            enabledEdits: {
              ...img.enabledEdits,
              [key]: !img.enabledEdits[key],
            },
            updatedAt: new Date().toISOString(),
          }
        : img
    );

    set({ project: { ...project, images: updatedImages } });
  },

  resetAdjustment: (key: AdjustmentKey) => {
    get().updateAdjustment(key, DEFAULT_ADJUSTMENTS[key]);
  },

  resetAllAdjustments: () => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? {
            ...img,
            edits: resetAdjustments(),
            enabledEdits: createEnabledEdits(),
            updatedAt: new Date().toISOString(),
          }
        : img
    );

    set({
      project: { ...project, images: updatedImages },
      processedImageUrl: null,
    });
  },

  applySuggestion: (adjustments: Partial<EditAdjustments>) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? {
            ...img,
            edits: { ...img.edits, ...adjustments },
            updatedAt: new Date().toISOString(),
          }
        : img
    );

    set({ project: { ...project, images: updatedImages } });
  },

  rotateImage: (degrees: number) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? {
            ...img,
            rotation: (img.rotation + degrees + 360) % 360,
            updatedAt: new Date().toISOString(),
          }
        : img
    );

    set({
      project: { ...project, images: updatedImages, updatedAt: new Date().toISOString() },
      processedImageUrl: null,
    });
  },

  setCrop: (crop: CropRect) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? { ...img, crop, updatedAt: new Date().toISOString() }
        : img
    );

    set({
      project: { ...project, images: updatedImages, updatedAt: new Date().toISOString() },
      processedImageUrl: null,
    });
  },

  resetCrop: () => {
    get().setCrop({ ...DEFAULT_CROP });
  },

  setMaskDataUrl: (maskDataUrl: string | null) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? { ...img, maskDataUrl, updatedAt: new Date().toISOString() }
        : img
    );

    set({
      project: { ...project, images: updatedImages, updatedAt: new Date().toISOString() },
      processedImageUrl: null,
    });
  },

  clearMask: () => {
    get().setMaskDataUrl(null);
  },

  setMaskBrushSize: (size) => set({ maskBrushSize: size }),
  setMaskBrushMode: (mode) => set({ maskBrushMode: mode }),

  setStudioTool: (tool) => set({ studioTool: tool }),
  setStudioBrushSize: (size) => set({ studioBrushSize: size }),
  setStudioTab: (tab) => set({ studioTab: tab }),

  updateStudioState: (partial) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const studio = { ...(activeImage.studio ?? DEFAULT_STUDIO_STATE), ...partial };
    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id ? { ...img, studio, updatedAt: new Date().toISOString() } : img
    );
    set({ project: { ...project, images: updatedImages } });
  },

  resetStudioCanvas: () => {
    const dims = getStudioDimensions(DEFAULT_STUDIO_STATE.aspectRatio);
    get().updateStudioState({
      ...DEFAULT_STUDIO_STATE,
      canvasWidth: dims.width,
      canvasHeight: dims.height,
      eraseMaskDataUrl: null,
    });
  },

  submitStudioEdit: async () => {
    const { project, studioTab, studioGenerating } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage || studioGenerating) return;

    const studio = activeImage.studio ?? DEFAULT_STUDIO_STATE;
    if (!studio.prompt.trim()) return;

    set({ studioGenerating: true });

    try {
      const img = await loadImageFromDataUrl(activeImage.originalDataUrl);
      const maxDim = Math.min(studio.canvasWidth, studio.canvasHeight, 1024);
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      const displayWidth = Math.round(img.naturalWidth * scale);
      const displayHeight = Math.round(img.naturalHeight * scale);

      const composite = await buildStudioComposite({
        imageDataUrl: activeImage.originalDataUrl,
        state: studio,
        displayWidth,
        displayHeight,
      });

      const res = await fetch("/api/studio-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositeDataUrl: composite.compositeDataUrl,
          maskDataUrl: composite.maskDataUrl,
          prompt: studio.prompt,
          width: composite.width,
          height: composite.height,
          mode: studioTab === "retexture" ? "retexture" : "edit",
          count: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Studio edit failed");

      const now = new Date().toISOString();
      const newResults = data.images.map((img: { url: string }) => ({
        id: uuidv4(),
        url: img.url,
        createdAt: now,
      }));

      const updatedImages = project.images.map((img) =>
        img.id === activeImage.id
          ? { ...img, studioResults: [...newResults, ...(img.studioResults ?? [])], updatedAt: now }
          : img
      );

      set({ project: { ...project, images: updatedImages, updatedAt: now } });
      await get().persistProject();
    } finally {
      set({ studioGenerating: false });
    }
  },

  applyStudioResult: async (url: string) => {
    const { project, persistProject } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const { thumbnailDataUrl, previewDataUrl } = await createImageThumbnails(url);
    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? {
            ...img,
            originalDataUrl: url,
            thumbnailDataUrl,
            previewDataUrl,
            studio: { ...(img.studio ?? DEFAULT_STUDIO_STATE), eraseMaskDataUrl: null },
            updatedAt: new Date().toISOString(),
          }
        : img
    );

    set({
      project: { ...project, images: updatedImages, updatedAt: new Date().toISOString() },
      processedImageUrl: null,
    });
    await persistProject();
  },

  updateImagineState: (partial: Partial<Omit<ImagineEditState, "settings">> & { settings?: Partial<ImagineEditState["settings"]> }) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const imagine = activeImage.imagine ?? defaultImagineState();
    const updatedImages = project.images.map((img) =>
      img.id === activeImage.id
        ? {
            ...img,
            imagine: {
              ...imagine,
              ...partial,
              settings: partial.settings ? { ...imagine.settings, ...partial.settings } : imagine.settings,
            },
            updatedAt: new Date().toISOString(),
          }
        : img
    );

    set({ project: { ...project, images: updatedImages } });
    if ("prompt" in partial) set({ imagineError: null });
  },

  toggleImagineStyle: (styleId) => {
    const { project } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const imagine = activeImage.imagine ?? defaultImagineState();
    get().updateImagineState({
      activeStyleId: imagine.activeStyleId === styleId ? null : styleId,
    });
  },

  submitImagineVersions: async (count = 1) => {
    const { project, imagineGenerating } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage || imagineGenerating) return;

    const imagine = activeImage.imagine ?? defaultImagineState();
    const prompt = imagine.prompt.trim();
    if (!prompt) return;

    const sourceImageId = activeImage.id;
    const sourceImageName = activeImage.name;
    const sourceBaseName = sourceImageName.replace(/ \(AI.*\)$/, "");
    const generationSettings = { ...imagine.settings };
    const styleId = imagine.activeStyleId;
    const projectId = project.id;

    set({
      imagineGenerating: true,
      imagineSourceImageId: sourceImageId,
      imagineSourceImageName: sourceImageName,
      imagineError: null,
    });

    try {
      const referenceImageDataUrl = await resolveReferenceForGeneration(activeImage);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          settings: generationSettings,
          count,
          styleId,
          referenceImageDataUrl,
        }),
      });

      let data: { error?: string; images?: { url: string }[]; referenceMediaUrl?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.ok
            ? "Generation failed — invalid server response"
            : `Server error (${res.status}). Try restarting the dev server with npm run dev:clean.`
        );
      }
      if (!res.ok) throw new Error(data.error ?? `Generation failed (${res.status})`);
      const generatedImages = data.images;
      if (!generatedImages?.length) throw new Error("No image returned");

      const newImages = await Promise.all(
        generatedImages.map((img: { url: string }, index: number) =>
          createProjectImageFromUrl(
            `${sourceBaseName} (AI${generatedImages.length > 1 ? ` ${index + 1}` : ""})`,
            img.url
          )
        )
      );

      for (const image of newImages) {
        void publishToExplore({
          imageUrl: image.originalDataUrl,
          prompt,
          styleId,
          source: "editor",
          sourceKey: `editor:${projectId}:${image.id}`,
        }).then((post) => {
          if (post) notifyExploreNewPost(post);
        });
      }

      const referenceMediaUrl = data.referenceMediaUrl ?? activeImage.referenceMediaUrl ?? null;
      const latestProject = get().project;
      if (!latestProject) return;

      const images = insertImagesAfter(
        latestProject.images.map((img) =>
          img.id === sourceImageId ? { ...img, referenceMediaUrl } : img
        ),
        sourceImageId,
        newImages
      );

      const firstNewId = newImages[0]?.id ?? latestProject.activeImageId;
      const userStayedOnSource = latestProject.activeImageId === sourceImageId;

      set({
        project: {
          ...latestProject,
          images,
          activeImageId: userStayedOnSource ? firstNewId : latestProject.activeImageId,
          updatedAt: new Date().toISOString(),
        },
        ...(userStayedOnSource
          ? {
              processedImageUrl: null,
              canvasView: { zoom: 1, panX: 0, panY: 0, fitToScreen: true },
            }
          : {}),
      });
      await get().persistProject();
    } catch (err) {
      set({
        imagineError: err instanceof Error ? err.message : "Generation failed",
      });
    } finally {
      set({
        imagineGenerating: false,
        imagineSourceImageId: null,
        imagineSourceImageName: null,
      });
    }
  },

  applyImagineResult: async (url: string) => {
    await get().applyStudioResult(url);
  },

  addImagineResultAsNewPhoto: async (url: string) => {
    const { project, persistProject } = get();
    const activeImage = getActiveImage(project);
    if (!project || !activeImage) return;

    const image = await createProjectImageFromUrl(`${activeImage.name} (version)`, url);
    const images = insertImagesAfter(project.images, activeImage.id, [image]);

    set({
      project: {
        ...project,
        images,
        activeImageId: image.id,
        updatedAt: new Date().toISOString(),
      },
      processedImageUrl: null,
    });
    await persistProject();
  },

  renameProject: (name: string) => {
    const { project } = get();
    if (!project) return;
    set({
      project: { ...project, name, updatedAt: new Date().toISOString() },
    });
  },

  renameImage: (imageId: string, name: string) => {
    const { project } = get();
    if (!project) return;
    const updatedImages = project.images.map((img) =>
      img.id === imageId ? { ...img, name } : img
    );
    set({ project: { ...project, images: updatedImages } });
  },

  deleteProjectById: async (id: string) => {
    await deleteStoredProject(id);
    const projects = await getProjectSummaries();
    set({ recentProjects: projects });
    const { project } = get();
    if (project?.id === id) {
      set({ project: null, processedImageUrl: null });
    }
  },

  setShowBefore: (show) => set({ showBefore: show }),
  setShowExportModal: (show) => set({ showExportModal: show }),
  setEditorModule: (module) => {
    set({
      editorModule: module,
      isAdjusting: false,
      adjustingCount: 0,
      activePanel: module === "edit" ? "light" : get().activePanel,
      showBefore: module === "edit" ? get().showBefore : false,
    });
  },
  setActivePanel: (panel) => set({ activePanel: panel }),
  setCanvasView: (view) =>
    set((state) => ({ canvasView: { ...state.canvasView, ...view } })),
  setExportSettings: (settings) =>
    set((state) => ({ exportSettings: { ...state.exportSettings, ...settings } })),
  setProcessedImageUrl: (url) => set({ processedImageUrl: url }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  beginAdjusting: () =>
    set((state) => {
      const count = state.adjustingCount + 1;
      return { adjustingCount: count, isAdjusting: true };
    }),
  endAdjusting: () =>
    set((state) => {
      const count = Math.max(0, state.adjustingCount - 1);
      return { adjustingCount: count, isAdjusting: count > 0 };
    }),

  persistProject: async () => {
    const { project } = get();
    if (!project) return;

    if (persistTimer) clearTimeout(persistTimer);

    return new Promise<void>((resolve) => {
      persistTimer = setTimeout(async () => {
        const current = get().project;
        if (!current) {
          resolve();
          return;
        }
        await saveProject(current);
        const projects = await getProjectSummaries();
        set({ recentProjects: projects });
        resolve();
      }, 400);
    });
  },
}));

export function useActiveImage(): ProjectImage | null {
  const project = useEditorStore((s) => s.project);
  if (!project?.activeImageId) return null;
  return project.images.find((img) => img.id === project.activeImageId) ?? null;
}
