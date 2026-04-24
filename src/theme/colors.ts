// Dark luxury palette: obsidian black base with champagne gold accents.
export const colors = {
  bg: '#0A0A0B',
  surface: '#121214',
  surfaceElevated: '#1A1A1D',
  surfaceMuted: '#202024',
  border: '#26262B',
  borderStrong: '#34343A',

  text: '#F5F5F7',
  textMuted: '#9A9AA3',
  textSubtle: '#6A6A73',

  gold: '#D4AF37',
  goldSoft: '#E8C872',
  goldDark: '#8A7125',

  accent: '#D4AF37',
  success: '#4ADE80',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#60A5FA',

  overlay: 'rgba(0,0,0,0.6)',
  shimmer: 'rgba(212,175,55,0.08)',
} as const;

export type Colors = typeof colors;
