/**
 * Shared Tailwind class constants for consistent styling across components.
 * Import these instead of duplicating long class strings.
 */

// Glass morphism panels
export const GLASS_PANEL =
  'bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)]';

export const GLASS_PANEL_STRONG =
  'bg-white/90 dark:bg-[#0F0F1E]/90 backdrop-blur-xl border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)]';

export const GLASS_BORDER =
  'border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)]';

export const GLASS_BORDER_SUBTLE =
  'border-[rgba(123,47,255,0.08)] dark:border-[rgba(198,255,77,0.08)]';

// Form inputs
export const INPUT_BASE =
  'rounded-lg bg-white/50 dark:bg-[#16162A]/50 border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] px-2 py-1.5 text-sm dark:text-[#F0EEFF] focus:ring-2 focus:ring-[#7B2FFF]/20 focus:border-[#7B2FFF]/40 transition-colors duration-150';

// Buttons
export const BTN_HOVER =
  'hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10';

export const BTN_ACTIVE =
  'bg-[#7B2FFF]/10 text-[#7B2FFF] dark:bg-[#7B2FFF]/20 dark:text-[#C6FF4D]';

export const BTN_INACTIVE =
  'text-[#080810]/70 dark:text-[#F0EEFF]/70 hover:bg-[#7B2FFF]/5 dark:hover:bg-[#7B2FFF]/10';

// Modal overlay
export const MODAL_OVERLAY =
  'absolute inset-0 z-40 flex items-center justify-center bg-black/20 dark:bg-[#080810]/60 backdrop-blur-[2px]';

export const MODAL_CONTENT =
  'bg-white/90 dark:bg-[#0F0F1E]/90 backdrop-blur-xl rounded-2xl shadow-lg border border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] px-8 py-6 flex flex-col items-center gap-4';

// Right sidebar panel
export const SIDEBAR_PANEL =
  'absolute right-0 top-0 h-full w-80 bg-white/85 dark:bg-[#0F0F1E]/85 backdrop-blur-xl border-l border-[rgba(123,47,255,0.12)] dark:border-[rgba(198,255,77,0.12)] shadow-lg z-50';

// Labels
export const FORM_LABEL =
  'block text-xs font-medium text-[#7A7A9A] mb-1';
