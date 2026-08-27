/**
 * Trackfit palette, ported from the web app's `--tf-*` CSS custom
 * properties (src/index.css). Keep these two in sync by hand — there is no
 * shared token source yet since the mobile app isn't a build target of the
 * web app's CSS pipeline.
 *
 * `text`/`background`/`tint`/`tabIconDefault`/`tabIconSelected` are the keys
 * components/Themed.tsx expects; everything else is the full Trackfit token
 * set for screens built directly against the palette.
 */
const dark = {
  bg: '#10121a',
  surface: '#1a1d27',
  surface2: '#222633',
  surface3: '#2c3140',
  line: 'rgba(255, 255, 255, 0.07)',
  line2: 'rgba(255, 255, 255, 0.13)',
  ink: '#ffffff',
  ink2: '#aeb2bf',
  mute: '#6d7180',
  mute2: '#454956',
  accent: '#f97316',
  accent2: '#fb923c',
  accentInk: '#1c0f04',
  danger: '#ef4444',
  good: '#22c55e',

  text: '#ffffff',
  background: '#10121a',
  tint: '#f97316',
  tabIconDefault: '#6d7180',
  tabIconSelected: '#f97316',
};

const light = {
  bg: '#fafafa',
  surface: '#ffffff',
  surface2: '#f5f5f5',
  surface3: '#eeeeee',
  line: 'rgba(0, 0, 0, 0.07)',
  line2: 'rgba(0, 0, 0, 0.13)',
  ink: '#000000',
  ink2: '#525252',
  mute: '#8f8f8f',
  mute2: '#bababa',
  accent: '#f97316',
  accent2: '#fb923c',
  accentInk: '#ffffff',
  danger: '#ef4444',
  good: '#22c55e',

  text: '#000000',
  background: '#fafafa',
  tint: '#f97316',
  tabIconDefault: '#8f8f8f',
  tabIconSelected: '#f97316',
};

const Colors = { light, dark };
export default Colors;
export type Theme = typeof dark;
