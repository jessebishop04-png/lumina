import type { SuggestionPreset } from "@/lib/types";



export const SUGGESTION_PRESETS: SuggestionPreset[] = [

  // Essentials

  {

    id: "auto-enhance",

    label: "Auto Enhance",

    description: "Balanced exposure, contrast, and color",

    icon: "✨",

    category: "Essentials",

    adjustments: {

      exposure: 8,

      contrast: 12,

      highlights: -10,

      shadows: 15,

      saturation: 8,

      vibrance: 12,

      sharpness: 15,

      clarity: 10,

    },

  },

  {

    id: "natural-balance",

    label: "Natural Balance",

    description: "Subtle correction that keeps things realistic",

    icon: "🌿",

    category: "Essentials",

    adjustments: {

      exposure: 4,

      contrast: 6,

      highlights: -5,

      shadows: 8,

      vibrance: 6,

      clarity: 4,

    },

  },

  {

    id: "bright-clean",

    label: "Bright & Clean",

    description: "Airy highlights and lifted shadows",

    icon: "☀️",

    category: "Essentials",

    adjustments: {

      exposure: 12,

      highlights: -12,

      shadows: 20,

      whites: 8,

      clarity: 6,

    },

  },

  {

    id: "deep-rich",

    label: "Deep & Rich",

    description: "Deeper tones with controlled highlights",

    icon: "🌑",

    category: "Essentials",

    adjustments: {

      contrast: 18,

      blacks: -12,

      shadows: -8,

      saturation: 10,

      clarity: 12,

    },

  },

  {

    id: "improve-contrast",

    label: "Improve Contrast",

    description: "Punchy blacks and bright highlights",

    icon: "◐",

    category: "Essentials",

    adjustments: {

      contrast: 25,

      blacks: -15,

      whites: 10,

      clarity: 15,

    },

  },

  {

    id: "sharpen-details",

    label: "Sharpen Details",

    description: "Crisp edges and fine detail",

    icon: "🔍",

    category: "Essentials",

    adjustments: {

      sharpness: 40,

      clarity: 25,

      contrast: 8,

    },

  },



  // Portrait

  {

    id: "soft-portrait",

    label: "Soft Portrait",

    description: "Flattering skin tones and gentle contrast",

    icon: "🙂",

    category: "Portrait",

    adjustments: {

      exposure: 5,

      shadows: 12,

      highlights: -8,

      vibrance: 8,

      clarity: -5,

      sharpness: 10,

    },

  },

  {

    id: "boost-subject",

    label: "Boost Subject",

    description: "Lift shadows and add clarity on faces",

    icon: "👤",

    category: "Portrait",

    adjustments: {

      shadows: 25,

      highlights: -15,

      clarity: 20,

      contrast: 10,

      exposure: 5,

    },

  },

  {

    id: "golden-hour",

    label: "Golden Hour",

    description: "Warm sunset glow on skin",

    icon: "🌅",

    category: "Portrait",

    adjustments: {

      temperature: 28,

      tint: 6,

      exposure: 6,

      shadows: 10,

      vibrance: 10,

    },

  },

  {

    id: "studio-flash",

    label: "Studio Flash",

    description: "Clean, even lighting look",

    icon: "📸",

    category: "Portrait",

    adjustments: {

      exposure: 8,

      contrast: 10,

      highlights: -10,

      whites: 5,

      sharpness: 18,

      clarity: 8,

    },

  },



  // Landscape

  {

    id: "landscape-vivid",

    label: "Vivid Landscape",

    description: "Saturated skies and rich foliage",

    icon: "🏔️",

    category: "Landscape",

    adjustments: {

      vibrance: 28,

      saturation: 15,

      clarity: 18,

      contrast: 12,

      shadows: 10,

    },

  },

  {

    id: "moody-sky",

    label: "Moody Sky",

    description: "Dramatic clouds and deep blues",

    icon: "🌧️",

    category: "Landscape",

    adjustments: {

      contrast: 20,

      highlights: -18,

      shadows: 8,

      temperature: -10,

      clarity: 14,

    },

  },

  {

    id: "sunset-glow",

    label: "Sunset Glow",

    description: "Warm horizon light and soft shadows",

    icon: "🌇",

    category: "Landscape",

    adjustments: {

      temperature: 22,

      tint: 8,

      exposure: 5,

      vibrance: 20,

      highlights: -12,

    },

  },

  {

    id: "forest-deep",

    label: "Forest Deep",

    description: "Rich greens with lifted shadow detail",

    icon: "🌲",

    category: "Landscape",

    adjustments: {

      shadows: 18,

      vibrance: 22,

      clarity: 16,

      contrast: 8,

      temperature: -5,

    },

  },



  // Black & White

  {

    id: "classic-bw",

    label: "Classic B&W",

    description: "Timeless monochrome with rich midtones",

    icon: "⬛",

    category: "Black & White",

    adjustments: {

      saturation: -100,

      contrast: 18,

      clarity: 12,

      blacks: -10,

    },

  },

  {

    id: "high-contrast-bw",

    label: "High Contrast B&W",

    description: "Bold blacks and bright whites",

    icon: "◼️",

    category: "Black & White",

    adjustments: {

      saturation: -100,

      contrast: 35,

      blacks: -20,

      whites: 15,

      clarity: 20,

    },

  },

  {

    id: "soft-bw",

    label: "Soft B&W",

    description: "Gentle grayscale with lifted shadows",

    icon: "🩶",

    category: "Black & White",

    adjustments: {

      saturation: -100,

      contrast: 8,

      shadows: 15,

      clarity: -8,

    },

  },



  // Vintage

  {

    id: "warm-up",

    label: "Warm Up",

    description: "Golden warmth and soft tones",

    icon: "🔥",

    category: "Vintage",

    adjustments: {

      temperature: 25,

      tint: 5,

      exposure: 5,

      saturation: 10,

      shadows: 8,

    },

  },

  {

    id: "faded-film",

    label: "Faded Film",

    description: "Lifted blacks and muted colors",

    icon: "🎞️",

    category: "Vintage",

    adjustments: {

      contrast: -10,

      blacks: 18,

      saturation: -12,

      exposure: 4,

      temperature: 10,

    },

  },

  {

    id: "retro-pop",

    label: "Retro Pop",

    description: "70s warmth with punchy saturation",

    icon: "📻",

    category: "Vintage",

    adjustments: {

      temperature: 18,

      tint: -5,

      saturation: 20,

      contrast: 10,

      vibrance: 15,

    },

  },

  {

    id: "matte-finish",

    label: "Matte Finish",

    description: "Soft contrast with lifted blacks",

    icon: "🖼️",

    category: "Vintage",

    adjustments: {

      contrast: -8,

      blacks: 22,

      clarity: -10,

      saturation: -5,

      exposure: 3,

    },

  },



  // Social

  {

    id: "colors-pop",

    label: "Make Colors Pop",

    description: "Vibrant, eye-catching saturation",

    icon: "🎨",

    category: "Social",

    adjustments: {

      saturation: 25,

      vibrance: 30,

      contrast: 10,

      clarity: 8,

    },

  },

  {

    id: "social-ready",

    label: "Social Ready",

    description: "Optimized for Instagram and TikTok",

    icon: "📱",

    category: "Social",

    adjustments: {

      exposure: 10,

      contrast: 15,

      saturation: 15,

      vibrance: 20,

      sharpness: 20,

      clarity: 12,

      highlights: -8,

    },

  },

  {

    id: "food-bright",

    label: "Food Bright",

    description: "Appetizing warmth and crisp detail",

    icon: "🍽️",

    category: "Social",

    adjustments: {

      exposure: 8,

      vibrance: 25,

      saturation: 12,

      sharpness: 22,

      clarity: 10,

      temperature: 8,

    },

  },

  {

    id: "street-punch",

    label: "Street Punch",

    description: "High energy urban look",

    icon: "🏙️",

    category: "Social",

    adjustments: {

      contrast: 22,

      clarity: 20,

      vibrance: 18,

      sharpness: 25,

      blacks: -8,

    },

  },

];



export const PRESET_CATEGORIES = [

  "Essentials",

  "Portrait",

  "Landscape",

  "Black & White",

  "Vintage",

  "Social",

] as const;



export function getPresetsByCategory(category: string): SuggestionPreset[] {

  return SUGGESTION_PRESETS.filter((p) => p.category === category);

}


