import type { CSSProperties } from 'react';
import type { CustomStyle, Theme } from './schema';
import { resolveColor } from './themes';

const SHADOWS = {
  none: 'none',
  soft: '0 1px 2px rgb(15 23 42 / 0.05), 0 4px 16px rgb(15 23 42 / 0.08)',
  strong: '0 4px 8px rgb(0 0 0 / 0.12), 0 16px 40px rgb(0 0 0 / 0.2)',
};
const WEIGHTS = { normal: 400, medium: 500, bold: 700 };

/** Prosty parser „prop: wartość; …” → obiekt stylu React (obsługuje też zmienne CSS --x). */
export function parseCss(css?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of (css ?? '').split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop || !val) continue;
    const key = prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = val;
  }
  return out;
}

export const hasStyle = (s?: CustomStyle) => !!s && Object.values(s).some((v) => v !== undefined && v !== '');

/** Zamienia własny wygląd na styl inline (kolory mogą być tokenami motywu). */
export function styleToCss(t: Theme, s?: CustomStyle): CSSProperties | undefined {
  if (!hasStyle(s)) return undefined;
  const st: Record<string, string | number> = {};
  if (s!.background) st.background = resolveColor(t, s!.background)!;
  if (s!.color) st.color = resolveColor(t, s!.color)!;
  if (s!.borderColor || s!.borderWidth !== undefined) {
    st.borderStyle = 'solid';
    st.borderWidth = `${s!.borderWidth ?? 1}px`;
    st.borderColor = resolveColor(t, s!.borderColor) ?? 'var(--c-border)';
  }
  if (s!.radius !== undefined) st.borderRadius = `${s!.radius}px`;
  if (s!.padding !== undefined) st.padding = `${s!.padding}px`;
  if (s!.fontSize !== undefined) st.fontSize = `${s!.fontSize}px`;
  if (s!.fontWeight) st.fontWeight = WEIGHTS[s!.fontWeight];
  if (s!.shadow) st.boxShadow = SHADOWS[s!.shadow];
  return { ...st, ...parseCss(s!.css) } as CSSProperties;
}

/** Opis wyglądu dla promptu AI. */
export function describeStyle(s?: CustomStyle): string | undefined {
  if (!hasStyle(s)) return undefined;
  const parts: string[] = [];
  if (s!.background) parts.push(`tło ${s!.background}`);
  if (s!.color) parts.push(`tekst ${s!.color}`);
  if (s!.borderColor || s!.borderWidth !== undefined) parts.push(`ramka ${s!.borderWidth ?? 1}px ${s!.borderColor ?? 'border'}`);
  if (s!.radius !== undefined) parts.push(`zaokrąglenie ${s!.radius}px`);
  if (s!.padding !== undefined) parts.push(`padding ${s!.padding}px`);
  if (s!.fontSize !== undefined) parts.push(`font ${s!.fontSize}px`);
  if (s!.fontWeight) parts.push(`grubość ${s!.fontWeight}`);
  if (s!.shadow) parts.push(`cień ${s!.shadow}`);
  if (s!.css) parts.push(`CSS: \`${s!.css.replace(/\n/g, ' ')}\``);
  if (s!.note) parts.push(`opis: „${s!.note}”`);
  return parts.join(', ');
}
