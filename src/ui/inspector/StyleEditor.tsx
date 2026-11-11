import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Paintbrush, RotateCcw, X } from 'lucide-react';
import type { CustomStyle } from '../../model/schema';
import { hasStyle } from '../../model/style';
import { useMockup } from '../../store/useMockup';

const TOKENS = ['primary', 'accent', 'success', 'warning', 'error', 'info', 'text', 'muted', 'surface', 'background', 'border'] as const;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-2">
      <span className="text-[11.5px] text-slate-600">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Kolor: token motywu (kropki) albo własny hex. */
function TokenColor({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const theme = useMockup((s) => s.mockup.theme);
  const hex = value?.startsWith('#') ? value : value ? (theme.colors as Record<string, string>)[value] : undefined;
  return (
    <div className="flex items-center gap-1">
      <label
        className="relative h-7 w-7 flex-none cursor-pointer overflow-hidden rounded-md ring-1 ring-slate-200"
        style={{ background: hex ?? 'repeating-conic-gradient(#e2e8f0 0 25%, #fff 0 50%) 50% / 8px 8px' }}
        title={value ?? 'brak'}
      >
        <input type="color" value={hex ?? '#ffffff'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <select className="ed-input !py-1 !text-xs" value={value?.startsWith('#') ? '#' : value ?? ''} onChange={(e) => onChange(e.target.value === '#' ? hex ?? '#888888' : e.target.value || undefined)}>
        <option value="">— domyślny —</option>
        {TOKENS.map((t) => (
          <option key={t} value={t}>
            motyw: {t}
          </option>
        ))}
        <option value="#">własny {value?.startsWith('#') ? value : 'hex'}</option>
      </select>
    </div>
  );
}

function Num({ value, onChange, max, suffix = 'px' }: { value?: number; onChange: (v?: number) => void; max: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={max}
        className="ed-input !py-1 !text-xs"
        placeholder="—"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Math.min(max, Math.max(0, Math.round(+e.target.value))))}
      />
      <span className="text-[11px] text-slate-400">{suffix}</span>
    </div>
  );
}

/** Sekcja „Własny wygląd” w inspektorze — dla elementu, kolumny i sekcji. */
export function StyleEditor({ value, onChange }: { value?: CustomStyle; onChange: (s?: CustomStyle) => void }) {
  const active = hasStyle(value);
  const [open, setOpen] = useState(active);
  const s = value ?? {};
  const set = (p: Partial<CustomStyle>) => {
    const next: Record<string, unknown> = { ...s, ...p };
    for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === '') delete next[k];
    onChange(Object.keys(next).length ? (next as CustomStyle) : undefined);
  };

  return (
    <div className="border-b border-slate-100">
      <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-bold text-slate-800 hover:bg-slate-50" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Paintbrush size={13} className="text-pink-500" />
        Własny wygląd
        {active && <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-semibold text-pink-700">aktywny</span>}
        {active && (
          <span
            role="button"
            className="ml-auto rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Przywróć wygląd z motywu"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
          >
            <RotateCcw size={13} />
          </span>
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          <Row label="Tło">
            <TokenColor value={s.background} onChange={(v) => set({ background: v })} />
          </Row>
          <Row label="Kolor tekstu">
            <TokenColor value={s.color} onChange={(v) => set({ color: v })} />
          </Row>
          <Row label="Ramka">
            <TokenColor value={s.borderColor} onChange={(v) => set({ borderColor: v })} />
          </Row>
          <Row label="Grubość ramki">
            <Num value={s.borderWidth} max={8} onChange={(v) => set({ borderWidth: v })} />
          </Row>
          <Row label="Zaokrąglenie">
            <Num value={s.radius} max={40} onChange={(v) => set({ radius: v })} />
          </Row>
          <Row label="Odstęp (padding)">
            <Num value={s.padding} max={64} onChange={(v) => set({ padding: v })} />
          </Row>
          <Row label="Rozmiar fontu">
            <Num value={s.fontSize} max={48} onChange={(v) => set({ fontSize: v || undefined })} />
          </Row>
          <Row label="Grubość fontu">
            <select className="ed-input !py-1 !text-xs" value={s.fontWeight ?? ''} onChange={(e) => set({ fontWeight: (e.target.value || undefined) as CustomStyle['fontWeight'] })}>
              <option value="">— domyślna —</option>
              <option value="normal">normalna</option>
              <option value="medium">średnia</option>
              <option value="bold">pogrubiona</option>
            </select>
          </Row>
          <Row label="Cień">
            <select className="ed-input !py-1 !text-xs" value={s.shadow ?? ''} onChange={(e) => set({ shadow: (e.target.value || undefined) as CustomStyle['shadow'] })}>
              <option value="">— domyślny —</option>
              <option value="none">brak</option>
              <option value="soft">miękki</option>
              <option value="strong">mocny</option>
            </select>
          </Row>
          <div>
            <label className="ed-label">Własny CSS</label>
            <textarea
              className="ed-input font-mono !text-[11.5px]"
              rows={3}
              placeholder={'letter-spacing: .5px;\ntext-transform: uppercase;\n--c-primary: #E11D48;'}
              value={s.css ?? ''}
              onChange={(e) => set({ css: e.target.value })}
            />
            <div className="mt-1 text-[10.5px] leading-snug text-slate-400">
              Deklaracje „właściwość: wartość;”. Zmienne motywu (np. <code>--c-primary</code>, <code>--radius</code>) zmieniają też wygląd kontrolek w środku.
            </div>
          </div>
          <div>
            <label className="ed-label">Opis wyglądu dla AI</label>
            <textarea
              className="ed-input !text-xs"
              rows={2}
              placeholder="np. wyróżniona karta z ikoną po lewej, jak baner promocyjny"
              value={s.note ?? ''}
              onChange={(e) => set({ note: e.target.value })}
            />
          </div>
          {active && (
            <button className="ed-btn justify-center !text-xs !text-slate-500" onClick={() => onChange(undefined)}>
              <X size={12} /> Wyczyść własny wygląd
            </button>
          )}
        </div>
      )}
    </div>
  );
}
