// The tokens of src/styles.scss of the site. Do not write a hex color that has a token here.

// Fixed colors: the professional theme does not change them
export const fixed = {
  brand: '#46586d',
  brandDark: '#374555',
  accent: '#a87558',
  // Copper as text (`accent` is for fills and icons: it is too light for letters)
  accentText: '#8a5c42',
  ink: '#1c1c1c',
  gray: '#6b6b6b',
  danger: '#e5484d',
  dangerStrong: '#c9302c',
  dangerBg: '#fde6e7',
  warningBg: '#fdf1d8',
  warning: '#9a5b0b',
  border: '#d6d6d6',
  borderSoft: '#eee',
  surface: '#f1f2f6',
  divider: '#f0f0f0',
  disabled: '#ccc',
  // The days that can not be picked in a calendar
  disabledText: '#c4c7cf',
  success: '#1f8f4d',
  white: '#fff',
  instagram: {
    orange: '#e8590c',
    pink: '#d62976',
    purple: '#962fbf',
    blue: '#4f5bd5',
  },
} as const;

export const radius = { card: 12, pill: 999 } as const;

// The part that a theme swaps (`--primary`, `--primary-light`, `--text`, `--muted`, `--on-primary`)
export type Theme = {
  name: 'client' | 'pro';
  background: string;
  primary: string;
  primaryLight: string;
  text: string;
  muted: string;
  // The letters on a `primary` background
  onPrimary: string;
  // Lists and dividers
  line: string;
  // The background of the fields of the sign in and sign up screens
  field: string;
  // A chosen option (a chip, a place of work): the light color with the main color on the client side; white with the
  // blue letters on the professional side, where the main color is white
  selectedBg: string;
  selectedFg: string;
  // The color of an error written on the background
  errorFg: string;
  // Messages: the background of the chat and the bubbles (theirs and mine) with the color of their letters
  chatBg: string;
  bubble: string;
  onBubble: string;
  bubbleMine: string;
  onBubbleMine: string;
  // Cards: the background and the border (the client has a shadow instead of a border)
  cardBg: string;
  cardBorder: string;
  // The stronger line (the dashed line over a total)
  lineStrong: string;
  // The bottom bar: background, icons that are not selected and the selected one
  tabBarBg: string;
  tabBarFg: string;
  tabBarActive: string;
};

export const clientTheme: Theme = {
  name: 'client',
  background: fixed.white,
  primary: fixed.brand,
  primaryLight: '#e8edf3',
  text: fixed.ink,
  muted: fixed.gray,
  onPrimary: fixed.white,
  line: fixed.borderSoft,
  field: fixed.surface,
  selectedBg: '#e8edf3',
  selectedFg: fixed.brand,
  errorFg: fixed.danger,
  chatBg: '#f7fafb',
  bubble: fixed.brand,
  onBubble: fixed.white,
  bubbleMine: '#e8edf3',
  onBubbleMine: fixed.ink,
  cardBg: fixed.white,
  cardBorder: 'transparent',
  lineStrong: fixed.border,
  tabBarBg: fixed.white,
  tabBarFg: '#aab2c0',
  tabBarActive: fixed.brand,
};

// The professional area: the blue becomes the background and the letters turn white
export const proTheme: Theme = {
  name: 'pro',
  background: fixed.brand,
  primary: fixed.white,
  primaryLight: 'rgba(255, 255, 255, 0.08)',
  text: fixed.white,
  muted: 'rgba(255, 255, 255, 0.92)',
  onPrimary: fixed.brand,
  line: 'rgba(255, 255, 255, 0.22)',
  field: fixed.white,
  selectedBg: fixed.white,
  selectedFg: fixed.brand,
  errorFg: '#ffc9cb',
  chatBg: 'transparent',
  bubble: 'rgba(255, 255, 255, 0.16)',
  onBubble: fixed.white,
  bubbleMine: fixed.white,
  onBubbleMine: fixed.brand,
  cardBg: 'rgba(255, 255, 255, 0.1)',
  cardBorder: 'rgba(255, 255, 255, 0.22)',
  lineStrong: 'rgba(255, 255, 255, 0.35)',
  tabBarBg: fixed.brandDark,
  tabBarFg: 'rgba(255, 255, 255, 0.6)',
  tabBarActive: fixed.white,
};
