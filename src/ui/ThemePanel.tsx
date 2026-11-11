import { useMemo, useState } from 'react';
import { Check, ExternalLink, Link2 } from 'lucide-react';
import { CONTROLS, DEFAULT_CONTROL } from '../model/controls';
import { resolveBind, sectionLeaves } from '../model/defaults';
import type { Theme } from '../model/schema';
import { FONTS, THEME_PRESETS } from '../model/themes';
import { useMockup } from '../store/useMockup';

const COLOR_LABELS: Record<keyof Theme['colors'], string> = {
  primary: 'Główny',
  accent: 'Akcent',
  background: 'Tło strony',
  surface: 'Tło kart',
  text: 'Tekst',
  muted: 'Tekst pomocniczy',
  border: 'Obramowania',
  success: 'Sukces',
  warning: 'Ostrzeżenie',
  error: 'Błąd',
  info: 'Informacja',
};

export function ColorInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-8 w-8 flex-none cursor-pointer overflow-hidden rounded-lg ring-1 ring-slate-200" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <input
        className="ed-input font-mono !text-xs"
        value={value}
        onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && onChange(e.target.value.toUpperCase())}
      />
    </div>
  );
}

export function ThemePanel() {
  const theme = useMockup((s) => s.mockup.theme);
  const { applyPreset, setColor, setTheme } = useMockup.getState();

  return (
    <div className="flex flex-col gap-5 p-3">
      <div>
        <div className="ed-label">Gotowe motywy</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(THEME_PRESETS).map(([name, p]) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`relative overflow-hidden rounded-xl border p-2 text-left transition hover:shadow-md ${
                theme.preset === name ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'
              }`}
              style={{ background: p.colors.background }}
            >
              <div className="mb-2 flex gap-1">
                {[p.colors.primary, p.colors.accent, p.colors.success, p.colors.error].map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full ring-1 ring-black/5" style={{ background: c }} />
                ))}
              </div>
              <div
                className="h-5 w-full"
                style={{ background: p.colors.surface, borderRadius: p.radius, border: `1px solid ${p.colors.border}` }}
              />
              <div className="mt-1.5 text-[11px] font-semibold" style={{ color: p.colors.text, fontFamily: p.font }}>
                {name}
              </div>
              {theme.preset === name && <Check size={14} className="absolute right-2 top-2 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="ed-label">Kolory</div>
        <div className="flex flex-col gap-2">
          {(Object.keys(COLOR_LABELS) as (keyof Theme['colors'])[]).map((k) => (
            <div key={k} className="grid grid-cols-[96px_1fr] items-center gap-2">
              <span className="text-xs text-slate-600">{COLOR_LABELS[k]}</span>
              <ColorInput value={theme.colors[k]} onChange={(hex) => setColor(k, hex)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="ed-label">Zaokrąglenie rogów: {theme.radius}px</div>
        <input type="range" min={0} max={20} value={theme.radius} onChange={(e) => setTheme({ radius: +e.target.value })} className="w-full accent-indigo-600" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="ed-label">Gęstość</div>
          <select className="ed-input" value={theme.density} onChange={(e) => setTheme({ density: e.target.value as Theme['density'] })}>
            <option value="comfortable">Wygodna</option>
            <option value="compact">Zwarta</option>
          </select>
        </div>
        <div>
          <div className="ed-label">Cienie</div>
          <select className="ed-input" value={theme.shadow} onChange={(e) => setTheme({ shadow: e.target.value as Theme['shadow'] })}>
            <option value="none">Brak</option>
            <option value="soft">Miękkie</option>
            <option value="strong">Mocne</option>
          </select>
        </div>
        <div className="col-span-2">
          <div className="ed-label">Font</div>
          <select className="ed-input" value={theme.font} onChange={(e) => setTheme({ font: e.target.value })}>
            {FONTS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="ed-label">Własny CSS (cała makieta)</div>
        <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
          Nadpisuje wygląd wszystkich kontrolek, np. <code>.ms-input</code>, <code>.ms-btn.primary</code>, <code>.ms-card</code>. Trafia też do promptu dla AI.
        </p>
        <textarea
          className="ed-input font-mono !text-[11.5px]"
          rows={5}
          placeholder={'.ms-input { border-width: 2px; }\n.ms-btn.primary { text-transform: uppercase; }'}
          value={theme.customCss ?? ''}
          onChange={(e) => setTheme({ customCss: e.target.value || undefined, preset: theme.preset })}
        />
      </div>

      <ControlRefs />
    </div>
  );
}

const isUrl = (v: string) => /^https?:\/\/\S+$/.test(v);

/** Linki do wzorców kontrolek — trafiają do promptu jako referencja dla AI. */
function ControlRefs() {
  const mockup = useMockup((s) => s.mockup);
  const refs = mockup.theme.controlRefs ?? {};
  const { setControlRef } = useMockup.getState();
  const [showAll, setShowAll] = useState(false);

  const used = useMemo(() => {
    const set = new Set<string>();
    for (const el of mockup.steps.flatMap((s) => s.sections.flatMap(sectionLeaves))) {
      if (el.kind !== 'field') continue;
      const f = resolveBind(mockup, el.bind);
      set.add(el.control ?? (f ? DEFAULT_CONTROL[f.type] : 'inputText'));
    }
    return set;
  }, [mockup]);

  const list = [...CONTROLS].sort((a, b) => Number(used.has(b.id)) - Number(used.has(a.id)));
  const visible = showAll ? list : list.filter((c) => used.has(c.id) || refs[c.id]);

  return (
    <div>
      <div className="ed-label flex items-center gap-1.5">
        <Link2 size={12} /> Wzorce kontrolek (linki dla AI)
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
        Domyślnie AI dostaje link do dokumentacji PrimeNG 17. Wpisz własny (Storybook, Figma, design system), aby go nadpisać.
        Niebieska kropka = kontrolka użyta w makiecie.
      </p>
      <div className="flex flex-col gap-2">
        {visible.map((c) => {
          const v = refs[c.id] ?? '';
          const bad = v !== '' && !isUrl(v);
          return (
            <div key={c.id}>
              <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700" title={c.tag}>
                <span className="truncate">{c.label}</span>
                {used.has(c.id) && <span className="h-1.5 w-1.5 flex-none rounded-full bg-indigo-500" title="Używana w makiecie" />}
              </div>
              <div className="flex items-center gap-1">
                <input
                  className={`ed-input !text-xs ${bad ? '!border-red-400' : ''}`}
                  placeholder={`domyślnie: ${c.doc.replace('https://', '')}`}
                  defaultValue={v}
                  key={v}
                  onBlur={(e) => setControlRef(c.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
                {isUrl(v) && (
                  <a href={v} target="_blank" rel="noreferrer" className="ed-icon-btn flex-none" title="Otwórz link">
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
              {bad && <div className="mt-0.5 text-[10.5px] text-red-500">To nie wygląda na link (http/https)</div>}
            </div>
          );
        })}
      </div>
      <button className="ed-btn mt-2 w-full justify-center !text-xs" onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Pokaż tylko używane' : `Pokaż wszystkie kontrolki (${CONTROLS.length})`}
      </button>
    </div>
  );
}
