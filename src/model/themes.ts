import type { Theme } from './schema';

export const THEME_PRESETS: Record<string, Theme> = {
  modern: {
    preset: 'modern',
    colors: {
      primary: '#2F5BEA',
      accent: '#7C5CFC',
      background: '#F4F6FB',
      surface: '#FFFFFF',
      text: '#0F172A',
      muted: '#64748B',
      border: '#E2E8F0',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#0284C7',
    },
    radius: 10,
    density: 'comfortable',
    font: 'Inter',
    shadow: 'soft',
  },
  'bank-navy': {
    preset: 'bank-navy',
    colors: {
      primary: '#1F3A68',
      accent: '#E8A33D',
      background: '#F7F8FA',
      surface: '#FFFFFF',
      text: '#14213D',
      muted: '#5B6B82',
      border: '#DCE2EA',
      success: '#2E7D32',
      warning: '#ED6C02',
      error: '#C62828',
      info: '#1565C0',
    },
    radius: 8,
    density: 'comfortable',
    font: 'IBM Plex Sans',
    shadow: 'soft',
  },
  'minimal-gray': {
    preset: 'minimal-gray',
    colors: {
      primary: '#18181B',
      accent: '#52525B',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#18181B',
      muted: '#71717A',
      border: '#E4E4E7',
      success: '#15803D',
      warning: '#B45309',
      error: '#B91C1C',
      info: '#1D4ED8',
    },
    radius: 6,
    density: 'compact',
    font: 'Inter',
    shadow: 'none',
  },
  'fresh-green': {
    preset: 'fresh-green',
    colors: {
      primary: '#0F9D74',
      accent: '#F59E0B',
      background: '#F2F7F5',
      surface: '#FFFFFF',
      text: '#0B2A22',
      muted: '#5C7A70',
      border: '#D7E5E0',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#0EA5E9',
    },
    radius: 14,
    density: 'comfortable',
    font: 'Manrope',
    shadow: 'soft',
  },
  dark: {
    preset: 'dark',
    colors: {
      primary: '#6D8BFF',
      accent: '#C084FC',
      background: '#0B1020',
      surface: '#151B2E',
      text: '#E7EBF5',
      muted: '#8D97B0',
      border: '#28314A',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#38BDF8',
    },
    radius: 12,
    density: 'comfortable',
    font: 'Inter',
    shadow: 'strong',
  },
};

export const FONTS = ['Inter', 'IBM Plex Sans', 'Manrope', 'system-ui'];

/** Zamienia motyw na CSS variables używane przez renderery kontrolek. */
export function themeToCssVars(t: Theme): Record<string, string> {
  const c = t.colors;
  const shadow =
    t.shadow === 'none'
      ? 'none'
      : t.shadow === 'soft'
        ? '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px rgb(15 23 42 / 0.06)'
        : '0 2px 4px rgb(0 0 0 / 0.12), 0 12px 32px rgb(0 0 0 / 0.18)';
  return {
    '--c-primary': c.primary,
    '--c-accent': c.accent,
    '--c-bg': c.background,
    '--c-surface': c.surface,
    '--c-text': c.text,
    '--c-muted': c.muted,
    '--c-border': c.border,
    '--c-success': c.success,
    '--c-warning': c.warning,
    '--c-error': c.error,
    '--c-info': c.info,
    '--radius': `${t.radius}px`,
    '--pad': t.density === 'compact' ? '8px' : '11px',
    '--gap': t.density === 'compact' ? '12px' : '20px',
    '--font': `'${t.font}', system-ui, sans-serif`,
    '--shadow': shadow,
  };
}

/** Kolor elementu: token motywu albo hex. */
export function resolveColor(t: Theme, color?: string): string | undefined {
  if (!color) return undefined;
  if (color.startsWith('#')) return color;
  return (t.colors as Record<string, string>)[color];
}
