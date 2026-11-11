import { useState, type ReactNode } from 'react';
import { MousePointerClick, Plus, Sparkles, Trash2, X } from 'lucide-react';
import {
  ACTION_EVENTS,
  ACTION_KINDS,
  SEMANTIC_TYPES,
  type Action,
  type ControlType,
  type Element,
  type SemanticType,
  type Transition,
  transitionAlign,
} from '../../model/schema';
import { CONTROL_GROUPS, CONTROLS, controlInfo, DEFAULT_CONTROL, SEMANTIC_LABELS } from '../../model/controls';
import { resolveBind } from '../../model/defaults';
import { locateElement, locateSection, useMockup } from '../../store/useMockup';
import { ColorInput } from '../ThemePanel';
import { StyleEditor } from './StyleEditor';

const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <div>
    <label className="ed-label">{label}</label>
    {children}
    {hint && <div className="mt-1 text-[11px] text-slate-400">{hint}</div>}
  </div>
);

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="border-b border-slate-100 p-4">
    <div className="mb-3 text-xs font-bold text-slate-800">{title}</div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

function AiHint({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div className="m-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">
        <Sparkles size={12} /> Podpowiedź dla AI
      </label>
      <textarea
        className="ed-input !border-violet-200 focus:!border-violet-400 focus:!ring-violet-100"
        rows={3}
        placeholder="Np. pokaż jako readonly z możliwością korekty, waliduj na blur, ukryj gdy…"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Inspector() {
  const sel = useMockup((s) => s.selection);
  const mockup = useMockup((s) => s.mockup);
  const activeStepId = useMockup((s) => s.activeStepId);

  if (sel.type === 'element') {
    const loc = locateElement(mockup, sel.elementId);
    if (loc) return <ElementInspector el={loc.list[loc.index]} />;
  }
  if (sel.type === 'section') {
    const loc = locateSection(mockup, sel.sectionId);
    if (loc) return <SectionInspector sectionId={sel.sectionId} />;
  }
  const stepId = sel.type === 'step' ? sel.stepId : activeStepId;
  if (sel.type === 'step' || sel.type === 'none') return <StepInspector stepId={stepId} />;
  return null;
}

/* ---------------- krok ---------------- */

function StepInspector({ stepId }: { stepId: string }) {
  const step = useMockup((s) => s.mockup.steps.find((x) => x.id === stepId));
  const steps = useMockup((s) => s.mockup.steps);
  const { updateStep, addTransition, updateTransition, removeTransition } = useMockup.getState();
  if (!step) return null;
  return (
    <div>
      <Header kind="Krok" id={step.id} />
      <Group title="Krok">
        <Field label="Tytuł">
          <input className="ed-input" value={step.title} onChange={(e) => updateStep(step.id, { title: e.target.value })} />
        </Field>
        <Field label="Co się tu dzieje (cel kroku)">
          <textarea
            className="ed-input"
            rows={3}
            placeholder="Np. klient podaje NIP, system pobiera dane z GUS"
            value={step.purpose ?? ''}
            onChange={(e) => updateStep(step.id, { purpose: e.target.value })}
          />
        </Field>
      </Group>
      <Group title="Kiedy krok się uruchamia">
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <span>
            <span className="block text-sm font-semibold text-slate-800">Krok opcjonalny</span>
            <span className="block text-[11px] text-slate-500">Pokazywany tylko, gdy spełniony jest warunek</span>
          </span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-amber-500"
            checked={!!step.optional}
            onChange={(e) => updateStep(step.id, { optional: e.target.checked || undefined, skipTo: e.target.checked ? step.skipTo : undefined })}
          />
        </label>
        <Field
          label={step.optional ? 'Warunek uruchomienia (wymagany)' : 'Kiedy się uruchamia (opcjonalnie)'}
          hint="Słowami albo na danych, np. „loan.hasCollateral = Tak” lub „klient wybrał formę prawną S.A.”"
        >
          <textarea
            className={`ed-input ${step.optional && !step.when ? '!border-amber-400' : ''}`}
            rows={2}
            placeholder={step.optional ? 'np. gdy klient zaznaczył, że jest zabezpieczenie' : 'np. po pozytywnej weryfikacji w GUS'}
            value={step.when ?? ''}
            onChange={(e) => updateStep(step.id, { when: e.target.value || undefined })}
          />
        </Field>
        {step.optional && (
          <Field label="Gdy warunek niespełniony, przejdź do">
            <select className="ed-input" value={step.skipTo ?? ''} onChange={(e) => updateStep(step.id, { skipTo: e.target.value || undefined })}>
              <option value="">następny krok (domyślnie)</option>
              {steps
                .filter((s) => s.id !== step.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.title}
                    {s.optional ? ' (opcjonalny)' : ''}
                  </option>
                ))}
            </select>
          </Field>
        )}
      </Group>
      <Group title="Przyciski i przejścia">
        {(step.transitions ?? []).map((t, i) => (
          <TransitionEditor
            key={i}
            t={t}
            steps={steps.map((s) => ({ id: s.id, title: s.title }))}
            onChange={(p) => updateTransition(step.id, i, p)}
            onRemove={() => removeTransition(step.id, i)}
          />
        ))}
        <button className="ed-btn justify-center border border-dashed border-slate-300 !text-xs" onClick={() => addTransition(step.id)}>
          <Plus size={13} /> Dodaj przejście
        </button>
      </Group>
      <AiHint value={step.aiHint} onChange={(v) => updateStep(step.id, { aiHint: v })} />
    </div>
  );
}

function TransitionEditor({
  t,
  steps,
  onChange,
  onRemove,
}: {
  t: Transition;
  steps: { id: string; title: string }[];
  onChange: (p: Partial<Transition>) => void;
  onRemove: () => void;
}) {
  const clean = (v: string) => (v === '' ? undefined : v);
  return (
    <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
      <button className="ed-icon-btn absolute right-1.5 top-1.5 !h-6 !w-6 hover:!text-red-600" onClick={onRemove}>
        <X size={13} />
      </button>
      <div className="grid grid-cols-2 gap-2 pr-6">
        <Field label="Etykieta">
          <input className="ed-input" value={t.label} onChange={(e) => onChange({ label: e.target.value })} />
        </Field>
        <Field label="Wygląd">
          <select className="ed-input" value={t.variant ?? 'primary'} onChange={(e) => onChange({ variant: e.target.value as Transition['variant'] })}>
            {['primary', 'secondary', 'outline', 'ghost', 'danger'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Idź do kroku">
          <select className="ed-input" value={t.to ?? ''} onChange={(e) => onChange({ to: clean(e.target.value) })}>
            <option value="">— (bez nawigacji)</option>
            {steps.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Warunek">
          <input className="ed-input" placeholder="np. formularz poprawny" value={t.when ?? ''} onChange={(e) => onChange({ when: clean(e.target.value) })} />
        </Field>
        <div className="col-span-2">
          <Field label="Położenie na dole kroku">
            <Segmented
              value={transitionAlign(t)}
              options={[
                ['left', '← Lewo'],
                ['right', 'Prawo →'],
              ]}
              onChange={(v) => onChange({ align: v })}
            />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Akcja">
            <input className="ed-input" placeholder="np. zapisz draft, wyślij wniosek" value={t.do ?? ''} onChange={(e) => onChange({ do: clean(e.target.value) })} />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ---------------- sekcja ---------------- */

function SectionInspector({ sectionId }: { sectionId: string }) {
  const mockup = useMockup((s) => s.mockup);
  const { updateSection } = useMockup.getState();
  const loc = locateSection(mockup, sectionId);
  if (!loc) return null;
  const sec = loc.step.sections[loc.index];
  return (
    <div>
      <Header kind="Sekcja" id={sec.id} />
      <Group title="Sekcja">
        <Field label="Tytuł">
          <input className="ed-input" value={sec.title ?? ''} onChange={(e) => updateSection(sec.id, { title: e.target.value })} />
        </Field>
        <Field label="Opis">
          <textarea className="ed-input" rows={2} value={sec.description ?? ''} onChange={(e) => updateSection(sec.id, { description: e.target.value })} />
        </Field>
        <Field label="Wygląd">
          <Segmented
            value={sec.emphasis ?? 'card'}
            options={[
              ['card', 'Karta'],
              ['highlight', 'Wyróżniona'],
              ['plain', 'Bez ramki'],
            ]}
            onChange={(v) => updateSection(sec.id, { emphasis: v === 'card' ? undefined : (v as 'highlight' | 'plain') })}
          />
        </Field>
      </Group>
      <StyleEditor value={sec.style} onChange={(st) => updateSection(sec.id, { style: st })} />
      <AiHint value={sec.aiHint} onChange={(v) => updateSection(sec.id, { aiHint: v })} />
    </div>
  );
}

/* ---------------- element ---------------- */

function ColumnInspector({ el }: { el: Extract<Element, { kind: 'column' }> }) {
  const { updateElement, removeElement } = useMockup.getState();
  const up = (p: Record<string, unknown>) => updateElement(el.id, p as Partial<Element>);
  return (
    <div>
      <Header kind="Kolumna" id={el.id} onDelete={() => (el.items.length === 0 || confirm(`Usunąć kolumnę z ${el.items.length} elementami?`)) && removeElement(el.id)} />
      <Group title="Kolumna">
        <Field label="Tytuł (opcjonalnie)">
          <input className="ed-input" value={el.title ?? ''} onChange={(e) => up({ title: e.target.value })} />
        </Field>
        <Field label={`Szerokość: ${el.span} / 12 kolumn`}>
          <input type="range" min={1} max={12} value={el.span} onChange={(e) => up({ span: +e.target.value })} className="w-full accent-indigo-600" />
          <div className="mt-1 flex gap-1">
            {[3, 4, 6, 8, 12].map((n) => (
              <button
                key={n}
                onClick={() => up({ span: n })}
                className={`flex-1 rounded-md py-1 text-[11px] font-semibold ${el.span === n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {n === 12 ? 'pełna' : n === 6 ? '½' : n === 4 ? '⅓' : n === 3 ? '¼' : '⅔'}
              </button>
            ))}
          </div>
        </Field>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Elementy w kolumnie stoją jeden pod drugim ({el.items.length}). Dodajesz je przyciskiem „+” na dole kolumny, a przeciągnąć możesz też elementy z innych miejsc.
        </p>
      </Group>
      <StyleEditor value={el.style} onChange={(st) => up({ style: st })} />
      <AiHint value={el.aiHint} onChange={(v) => up({ aiHint: v })} />
    </div>
  );
}

function ElementInspector({ el }: { el: Element }) {
  if (el.kind === 'column') return <ColumnInspector el={el} />;
  return <LeafInspector el={el} />;
}

function LeafInspector({ el }: { el: Exclude<Element, { kind: 'column' }> }) {
  const mockup = useMockup((s) => s.mockup);
  const { updateElement, removeElement } = useMockup.getState();
  const up = (p: Record<string, unknown>) => updateElement(el.id, p as Partial<Element>);
  const kindLabel = { field: 'Pole', text: 'Tekst', info: 'Komunikat', button: 'Przycisk', table: 'Tabela', placeholder: 'Placeholder AI' }[el.kind];

  return (
    <div>
      <Header kind={kindLabel} id={el.id} onDelete={() => removeElement(el.id)} />

      {el.kind === 'field' && <FieldProps el={el} up={up} />}

      {el.kind === 'text' && (
        <Group title="Tekst">
          <Field label="Treść">
            <textarea className="ed-input" rows={3} value={el.text} onChange={(e) => up({ text: e.target.value })} />
          </Field>
          <Field label="Styl">
            <Segmented
              value={el.level ?? 'body'}
              options={[
                ['h1', 'H1'],
                ['h2', 'H2'],
                ['h3', 'H3'],
                ['body', 'Tekst'],
                ['muted', 'Drobny'],
              ]}
              onChange={(v) => up({ level: v })}
            />
          </Field>
        </Group>
      )}

      {el.kind === 'info' && (
        <Group title="Komunikat">
          <Field label="Tytuł (opcjonalnie)">
            <input className="ed-input" value={el.title ?? ''} onChange={(e) => up({ title: e.target.value })} />
          </Field>
          <Field label="Treść">
            <textarea className="ed-input" rows={3} value={el.text} onChange={(e) => up({ text: e.target.value })} />
          </Field>
          <Field label="Rodzaj">
            <Segmented
              value={el.variant ?? 'info'}
              options={[
                ['info', 'Info'],
                ['success', 'Sukces'],
                ['warning', 'Uwaga'],
                ['error', 'Błąd'],
              ]}
              onChange={(v) => up({ variant: v })}
            />
          </Field>
        </Group>
      )}

      {el.kind === 'button' && (
        <Group title="Przycisk">
          <Field label="Etykieta">
            <input className="ed-input" value={el.label} onChange={(e) => up({ label: e.target.value })} />
          </Field>
          <Field label="Wariant">
            <Segmented
              value={el.variant ?? 'secondary'}
              options={[
                ['primary', 'Główny'],
                ['secondary', 'Drugi'],
                ['outline', 'Obrys'],
                ['ghost', 'Ghost'],
                ['danger', 'Usuń'],
              ]}
              onChange={(v) => up({ variant: v })}
            />
          </Field>
        </Group>
      )}

      {el.kind === 'table' && (
        <Group title="Tabela">
          <Field label="Tytuł">
            <input className="ed-input" value={el.title ?? ''} onChange={(e) => up({ title: e.target.value })} />
          </Field>
          <Field label="Dane (encja)">
            <select className="ed-input" value={el.entity ?? ''} onChange={(e) => up({ entity: e.target.value, columns: undefined })}>
              <option value="">— wybierz —</option>
              {mockup.data.map((e) => (
                <option key={e.entity} value={e.entity}>
                  {e.label ?? e.entity} ({e.entity})
                </option>
              ))}
            </select>
          </Field>
          {el.entity && (
            <Field label="Kolumny">
              <div className="flex flex-wrap gap-1.5">
                {mockup.data
                  .find((e) => e.entity === el.entity)
                  ?.fields.map((f) => {
                    const on = el.columns?.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => up({ columns: on ? el.columns!.filter((c) => c !== f.id) : [...(el.columns ?? []), f.id] })}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${on ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
              </div>
            </Field>
          )}
          <Field label="Akcje wiersza" hint="Po przecinku, np. Edytuj, Usuń">
            <input
              className="ed-input"
              value={(el.rowActions ?? []).join(', ')}
              onChange={(e) => up({ rowActions: e.target.value ? e.target.value.split(',').map((x) => x.trim()) : undefined })}
            />
          </Field>
        </Group>
      )}

      {el.kind === 'placeholder' && (
        <Group title="Placeholder dla AI">
          <Field label="Co ma tu być?">
            <textarea className="ed-input" rows={4} value={el.text} onChange={(e) => up({ text: e.target.value })} />
          </Field>
          <Field label="Wysokość">
            <Segmented
              value={el.height ?? 'md'}
              options={[
                ['sm', 'Mała'],
                ['md', 'Średnia'],
                ['lg', 'Duża'],
              ]}
              onChange={(v) => up({ height: v })}
            />
          </Field>
        </Group>
      )}

      <Group title="Układ i kolor">
        <Field label={`Szerokość: ${el.span} / 12 kolumn`}>
          <input type="range" min={1} max={12} value={el.span} onChange={(e) => up({ span: +e.target.value })} className="w-full accent-indigo-600" />
          <div className="mt-1 flex gap-1">
            {[3, 4, 6, 8, 12].map((n) => (
              <button
                key={n}
                onClick={() => up({ span: n })}
                className={`flex-1 rounded-md py-1 text-[11px] font-semibold ${el.span === n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {n === 12 ? 'pełna' : n === 6 ? '½' : n === 4 ? '⅓' : n === 3 ? '¼' : '⅔'}
              </button>
            ))}
          </div>
        </Field>
        {el.kind !== 'field' && el.kind !== 'table' && <ColorPicker value={el.color} onChange={(c) => up({ color: c })} />}
      </Group>

      <StyleEditor value={el.style} onChange={(st) => up({ style: st })} />

      {(el.kind === 'field' || el.kind === 'button') && <ActionsEditor actions={el.on ?? []} onChange={(on) => up({ on: on.length ? on : undefined })} />}

      <AiHint value={el.aiHint} onChange={(v) => up({ aiHint: v })} />
    </div>
  );
}

function FieldProps({ el, up }: { el: Extract<Element, { kind: 'field' }>; up: (p: Record<string, unknown>) => void }) {
  const mockup = useMockup((s) => s.mockup);
  const { addField, addEntity } = useMockup.getState();
  const field = resolveBind(mockup, el.bind);
  const defaultControl: ControlType = field ? DEFAULT_CONTROL[field.type] : 'inputText';
  const control = el.control ?? defaultControl;
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{ entity: number; label: string; type: SemanticType }>({ entity: 0, label: '', type: 'text' });

  const createField = () => {
    let ei = draft.entity;
    if (mockup.data.length === 0) {
      addEntity();
      ei = 0;
    }
    const id =
      draft.label
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/ł/g, 'l')
        .replace(/[^\w ]/g, '')
        .trim()
        .split(/\s+/)
        .map((w, i) => (i ? w[0]?.toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
        .join('') || 'pole';
    const realId = addField(ei, { id, label: draft.label || 'Nowe pole', type: draft.type });
    const entity = useMockup.getState().mockup.data[ei].entity;
    up({ bind: `${entity}.${realId}`, label: undefined });
    setCreating(false);
    setDraft({ ...draft, label: '' });
  };

  return (
    <Group title="Pole formularza">
      <Field label="Dane — co wybiera / wpisuje użytkownik">
        <select
          className="ed-input"
          value={el.bind ?? ''}
          onChange={(e) => {
            if (e.target.value === '__new') return setCreating(true);
            up({ bind: e.target.value || undefined, label: undefined, control: undefined });
          }}
        >
          <option value="">— wybierz dane —</option>
          {mockup.data.map((e) => (
            <optgroup key={e.entity} label={e.label ?? e.entity}>
              {e.fields.map((f) => (
                <option key={f.id} value={`${e.entity}.${f.id}`}>
                  {f.label} · {f.type}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="__new">＋ Nowe pole danych…</option>
        </select>
      </Field>

      {creating && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Field label="Nazwa pola">
                <input
                  autoFocus
                  className="ed-input"
                  placeholder="np. Kwota kredytu"
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && createField()}
                />
              </Field>
            </div>
            <Field label="Encja">
              <select className="ed-input" value={draft.entity} onChange={(e) => setDraft({ ...draft, entity: +e.target.value })}>
                {mockup.data.length === 0 && <option value={0}>(nowa)</option>}
                {mockup.data.map((e, i) => (
                  <option key={e.entity} value={i}>
                    {e.entity}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Typ">
              <select className="ed-input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as SemanticType })}>
                {SEMANTIC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SEMANTIC_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-2 flex justify-end gap-1">
            <button className="ed-btn !text-xs" onClick={() => setCreating(false)}>
              Anuluj
            </button>
            <button className="ed-btn-primary !text-xs" onClick={createField}>
              Dodaj i wybierz
            </button>
          </div>
        </div>
      )}

      <Field label="Szybki wybór kontrolki (PrimeNG)">
        <div className="grid grid-cols-3 gap-1">
          {QUICK_CONTROLS.map(([id, l]) => (
            <button
              key={id}
              onClick={() => up({ control: id === defaultControl ? undefined : id })}
              className={`rounded-md px-1 py-1.5 text-[11px] font-semibold leading-tight transition ${
                control === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Kontrolka" hint={el.control ? `Domyślna dla typu: ${controlInfo(defaultControl).label}` : 'Dobrana automatycznie z typu danych'}>
        <select className="ed-input" value={control} onChange={(e) => up({ control: e.target.value === defaultControl ? undefined : e.target.value })}>
          {CONTROL_GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {CONTROLS.filter((c) => c.group === g).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {c.id === defaultControl ? ' (domyślna)' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <a
        href={mockup.theme.controlRefs?.[control] ?? controlInfo(control).doc}
        target="_blank"
        rel="noreferrer"
        className="-mt-1 flex items-center gap-1.5 truncate rounded-lg bg-indigo-50 px-2 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
        title={mockup.theme.controlRefs?.[control] ?? controlInfo(control).doc}
      >
        <span className="font-mono">{controlInfo(control).tag}</span>
        <span className="text-indigo-400">·</span>
        {mockup.theme.controlRefs?.[control] ? '🔗 własny wzorzec' : '📘 dokumentacja PrimeNG'}
      </a>

      {controlInfo(control).options && <OptionsSource el={el} up={up} optional={controlInfo(control).options === 'optional'} />}

      <Field label="Etykieta">
        <input className="ed-input" placeholder={field?.label ?? 'Etykieta'} value={el.label ?? ''} onChange={(e) => up({ label: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Placeholder">
          <input className="ed-input" value={el.placeholder ?? ''} onChange={(e) => up({ placeholder: e.target.value })} />
        </Field>
        <Field label="Wymagane">
          <select
            className="ed-input"
            value={el.required === undefined ? '' : String(el.required)}
            onChange={(e) => up({ required: e.target.value === '' ? undefined : e.target.value === 'true' })}
          >
            <option value="">z danych ({field?.required ? 'tak' : 'nie'})</option>
            <option value="true">tak</option>
            <option value="false">nie</option>
          </select>
        </Field>
      </div>
      <Field label="Podpowiedź pod polem (hint)">
        <input className="ed-input" value={el.hint ?? ''} onChange={(e) => up({ hint: e.target.value })} />
      </Field>
    </Group>
  );
}

const QUICK_CONTROLS: [ControlType, string][] = [
  ['inputText', 'InputText'],
  ['dropdown', 'Dropdown'],
  ['autoComplete', 'AutoComplete'],
  ['multiSelect', 'MultiSelect'],
  ['checkbox', 'Checkbox'],
  ['radioButton', 'Radio'],
  ['selectButton', 'SelectButton'],
  ['inputSwitch', 'InputSwitch'],
  ['calendar', 'Calendar'],
  ['inputNumber', 'InputNumber'],
  ['inputMask', 'InputMask'],
  ['inputTextarea', 'Textarea'],
];

function OptionsSource({ el, up, optional }: { el: Extract<Element, { kind: 'field' }>; up: (p: Record<string, unknown>) => void; optional?: boolean }) {
  const mockup = useMockup((s) => s.mockup);
  const field = resolveBind(mockup, el.bind);
  const inheritedDict = field?.dictionary;
  const [mode, setMode] = useState<'list' | 'dict'>(el.dictionary || (inheritedDict && !el.options) ? 'dict' : 'list');
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
      <Field label="Skąd opcje?">
        <Segmented
          value={mode}
          options={[
            ['list', 'Stała lista'],
            ['dict', 'Słownik z backendu'],
          ]}
          onChange={(v) => {
            setMode(v);
            if (v === 'list') up({ dictionary: undefined });
            else up({ options: undefined });
          }}
        />
      </Field>
      {mode === 'dict' ? (
        <Field
          label="Nazwa słownika"
          hint={inheritedDict && !el.dictionary ? `Z danych: ${inheritedDict} — wpisz, aby nadpisać` : 'Kod słownika z backendu, np. CEL_KREDYTU, KRAJE, WALUTY'}
        >
          <input
            className="ed-input font-mono"
            placeholder={inheritedDict ?? 'NAZWA_SLOWNIKA'}
            value={el.dictionary ?? ''}
            onChange={(e) => up({ dictionary: e.target.value.toUpperCase().replace(/[^\w.-]/g, '_') })}
          />
        </Field>
      ) : (
        <Field
          label="Opcje (po jednej w linii)"
          hint={
            field?.options?.length && !el.options
              ? 'Dziedziczone z danych — wpisz, aby nadpisać'
              : optional
                ? 'Puste = pojedynczy checkbox; kilka linii = grupa checkboxów'
                : undefined
          }
        >
          <textarea
            className="ed-input"
            rows={4}
            value={(el.options ?? field?.options ?? []).join('\n')}
            onChange={(e) => up({ options: e.target.value ? e.target.value.split('\n') : undefined })}
          />
        </Field>
      )}
    </div>
  );
}

function ActionsEditor({ actions, onChange }: { actions: Action[]; onChange: (a: Action[]) => void }) {
  const set = (i: number, p: Partial<Action>) => onChange(actions.map((a, j) => (j === i ? clean({ ...a, ...p }) : a)));
  return (
    <Group title="Co ma się zadziać (akcje)">
      {actions.map((a, i) => (
        <div key={i} className="relative rounded-xl border border-amber-200 bg-amber-50/40 p-2.5">
          <button className="ed-icon-btn absolute right-1.5 top-1.5 !h-6 !w-6 hover:!text-red-600" onClick={() => onChange(actions.filter((_, j) => j !== i))}>
            <X size={13} />
          </button>
          <div className="grid grid-cols-2 gap-2 pr-6">
            <Field label="Kiedy">
              <select className="ed-input" value={a.event} onChange={(e) => set(i, { event: e.target.value as Action['event'] })}>
                {ACTION_EVENTS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Co">
              <select className="ed-input" value={a.do} onChange={(e) => set(i, { do: e.target.value as Action['do'] })}>
                {ACTION_KINDS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <input className="ed-input" placeholder="Cel: usługa / pole / krok (np. GUS: pobierz dane)" value={a.target ?? ''} onChange={(e) => set(i, { target: e.target.value })} />
            <input className="ed-input" placeholder="Warunek (opcjonalnie)" value={a.when ?? ''} onChange={(e) => set(i, { when: e.target.value })} />
            <input className="ed-input" placeholder="Potem / efekt (np. wypełnij nazwę i adres)" value={a.then ?? ''} onChange={(e) => set(i, { then: e.target.value })} />
          </div>
        </div>
      ))}
      <button className="ed-btn justify-center border border-dashed border-amber-300 !text-xs text-amber-700" onClick={() => onChange([...actions, { event: 'change', do: 'call' }])}>
        <MousePointerClick size={13} /> Dodaj akcję
      </button>
    </Group>
  );
}

function clean(a: Action): Action {
  const out = { ...a } as Record<string, unknown>;
  for (const k of ['target', 'when', 'then']) if (!out[k]) delete out[k];
  return out as Action;
}

function ColorPicker({ value, onChange }: { value?: string; onChange: (c: string | undefined) => void }) {
  const theme = useMockup((s) => s.mockup.theme);
  const tokens = ['primary', 'accent', 'success', 'warning', 'error', 'info', 'text', 'muted'] as const;
  const custom = value?.startsWith('#');
  return (
    <Field label="Kolor">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onChange(undefined)}
          title="Domyślny"
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-slate-400 ${!value ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
        >
          <X size={12} />
        </button>
        {tokens.map((t) => (
          <button
            key={t}
            title={t}
            onClick={() => onChange(t)}
            className={`h-7 w-7 rounded-full ring-1 ring-black/5 ${value === t ? 'ring-2 !ring-indigo-500 ring-offset-1' : ''}`}
            style={{ background: theme.colors[t] }}
          />
        ))}
      </div>
      <div className="mt-2">
        <ColorInput value={custom ? value! : '#888888'} onChange={(hex) => onChange(hex)} />
      </div>
    </Field>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-md px-1.5 py-1 text-[11.5px] font-semibold transition ${value === v ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Header({ kind, id, onDelete }: { kind: string; id: string; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">{kind}</div>
        <div className="font-mono text-xs text-slate-400">{id}</div>
      </div>
      {onDelete && (
        <button className="ed-icon-btn hover:!bg-red-50 hover:!text-red-600" onClick={onDelete} title="Usuń">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
