import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import type {
  ColumnElement,
  ControlType,
  DataEntity,
  DataField,
  Element,
  ElementKind,
  Mockup,
  Section,
  Step,
  Theme,
  Transition,
} from '../model/schema';
import {
  emptyMockup,
  evenSpans,
  exampleMockup,
  newColumn,
  newElement,
  newSection,
  newStep,
  nextStepId,
  rowUsed,
  sectionLeaves,
  uid,
} from '../model/defaults';
import { THEME_PRESETS } from '../model/themes';
import { Mockup as MockupSchema } from '../model/schema';
import { migrate } from '../io/yaml';

export type Selection =
  | { type: 'none' }
  | { type: 'step'; stepId: string }
  | { type: 'section'; sectionId: string }
  | { type: 'element'; elementId: string };

const STORAGE_KEY = 'mockup-studio:autosave';

function loadInitial(): Mockup {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const res = MockupSchema.safeParse(migrate(JSON.parse(raw)));
      if (res.success) return res.data;
    }
  } catch {
    /* brak storage */
  }
  return exampleMockup();
}

interface Loc {
  step: Step;
  section: Section;
  rowIndex: number;
  /** Tablica, w której leży element: wiersz albo `items` kolumny. */
  list: Element[];
  index: number;
  /** Kolumna, jeśli element leży w kolumnie. */
  column?: ColumnElement;
}

export function locateElement(m: Mockup, elementId: string): Loc | undefined {
  for (const step of m.steps)
    for (const section of step.sections)
      for (let r = 0; r < section.rows.length; r++) {
        const row = section.rows[r];
        const i = row.findIndex((e) => e.id === elementId);
        if (i >= 0) return { step, section, rowIndex: r, list: row, index: i };
        for (const cell of row) {
          if (cell.kind !== 'column') continue;
          const j = cell.items.findIndex((e) => e.id === elementId);
          if (j >= 0) return { step, section, rowIndex: r, list: cell.items as Element[], index: j, column: cell };
        }
      }
  return undefined;
}

function cloneWithIds(el: Element): Element {
  const copy = JSON.parse(JSON.stringify(el)) as Element;
  copy.id = uid(copy.kind === 'column' ? 'col' : 'el');
  if (copy.kind === 'column') copy.items.forEach((x) => (x.id = uid('el')));
  return copy;
}

export function locateSection(m: Mockup, sectionId: string): { step: Step; index: number } | undefined {
  for (const step of m.steps) {
    const index = step.sections.findIndex((s) => s.id === sectionId);
    if (index >= 0) return { step, index };
  }
  return undefined;
}

interface State {
  mockup: Mockup;
  activeStepId: string;
  selection: Selection;
  mode: 'edit' | 'preview';

  // meta
  setMockup: (m: Mockup) => void;
  newMockup: () => void;
  loadExample: () => void;
  updateMeta: (p: Partial<Pick<Mockup, 'name' | 'description' | 'aiContext'>>) => void;
  select: (s: Selection) => void;
  setMode: (m: 'edit' | 'preview') => void;
  setActiveStep: (id: string) => void;

  // kroki
  addStep: (opts?: { optional?: boolean }) => void;
  updateStep: (id: string, p: Partial<Omit<Step, 'id' | 'sections'>>) => void;
  removeStep: (id: string) => void;
  moveStep: (id: string, dir: -1 | 1) => void;
  duplicateStep: (id: string) => void;
  addTransition: (stepId: string) => void;
  updateTransition: (stepId: string, idx: number, p: Partial<Transition>) => void;
  removeTransition: (stepId: string, idx: number) => void;

  // sekcje
  addSection: (stepId: string) => void;
  updateSection: (id: string, p: Partial<Omit<Section, 'id' | 'rows'>>) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, dir: -1 | 1) => void;
  addRow: (sectionId: string) => void;
  removeRow: (sectionId: string, rowIndex: number) => void;

  // elementy
  addElement: (sectionId: string, rowIndex: number, kind: ElementKind, init?: Partial<Element>, columnId?: string) => void;
  addColumn: (sectionId: string, rowIndex: number) => void;
  splitRow: (sectionId: string, rowIndex: number, n: number) => void;
  moveRow: (sectionId: string, rowIndex: number, dir: -1 | 1) => void;
  updateElement: (id: string, p: Partial<Element>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (id: string, sectionId: string, rowIndex: number, index: number, columnId?: string) => void;
  moveElementToNewRow: (id: string, sectionId: string, rowIndex: number) => void;

  // dane
  addEntity: () => void;
  updateEntity: (idx: number, p: Partial<Omit<DataEntity, 'fields'>>) => void;
  removeEntity: (idx: number) => void;
  addField: (entityIdx: number, f?: Partial<DataField>) => string;
  updateField: (entityIdx: number, fieldIdx: number, p: Partial<DataField>) => void;
  removeField: (entityIdx: number, fieldIdx: number) => void;

  // motyw
  setTheme: (p: Partial<Theme>) => void;
  setColor: (key: keyof Theme['colors'], hex: string) => void;
  applyPreset: (name: string) => void;
  setControlRef: (control: ControlType, url: string) => void;
}

export const useMockup = create<State>()(
  temporal(
    immer((set, get) => {
      const initial = loadInitial();
      return {
        mockup: initial,
        activeStepId: initial.steps[0]?.id ?? '',
        selection: { type: 'none' },
        mode: 'edit',

        setMockup: (m) =>
          set((s) => {
            s.mockup = m;
            s.activeStepId = m.steps[0]?.id ?? '';
            s.selection = { type: 'none' };
          }),
        newMockup: () => get().setMockup(emptyMockup()),
        loadExample: () => get().setMockup(exampleMockup()),
        updateMeta: (p) => set((s) => void Object.assign(s.mockup, p)),
        select: (sel) => set((s) => void (s.selection = sel)),
        setMode: (mode) => set((s) => void ((s.mode = mode), (s.selection = { type: 'none' }))),
        setActiveStep: (id) => set((s) => void (s.activeStepId = id)),

        addStep: (opts) =>
          set((s) => {
            const id = nextStepId(s.mockup);
            const last = s.mockup.steps[s.mockup.steps.length - 1];
            const step = newStep(id, opts?.optional ? `Krok opcjonalny ${s.mockup.steps.length + 1}` : `Krok ${s.mockup.steps.length + 1}`, last?.id);
            if (opts?.optional) step.optional = true;
            s.mockup.steps.push(step);
            if (last) {
              // „Dalej” poprzedniego kroku prowadzi do nowego kroku
              last.transitions ??= [];
              const ids = s.mockup.steps.map((x) => x.id);
              const lastIdx = ids.indexOf(last.id);
              const hasForward = last.transitions.some((t) => t.to && ids.indexOf(t.to) > lastIdx);
              const dalej = last.transitions.find((t) => !t.to && !t.do && (t.variant ?? 'primary') === 'primary');
              if (dalej) dalej.to = id;
              else if (!hasForward) last.transitions.push({ label: 'Dalej', to: id, variant: 'primary', align: 'right' });
            }
            s.activeStepId = id;
            s.selection = { type: 'step', stepId: id };
          }),
        updateStep: (id, p) =>
          set((s) => {
            const st = s.mockup.steps.find((x) => x.id === id);
            if (st) Object.assign(st, p);
          }),
        removeStep: (id) =>
          set((s) => {
            const i = s.mockup.steps.findIndex((x) => x.id === id);
            if (i < 0 || s.mockup.steps.length === 1) return;
            s.mockup.steps.splice(i, 1);
            s.activeStepId = s.mockup.steps[Math.max(0, i - 1)].id;
            s.selection = { type: 'none' };
          }),
        moveStep: (id, dir) =>
          set((s) => {
            const a = s.mockup.steps;
            const i = a.findIndex((x) => x.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= a.length) return;
            [a[i], a[j]] = [a[j], a[i]];
          }),
        duplicateStep: (id) =>
          set((s) => {
            const i = s.mockup.steps.findIndex((x) => x.id === id);
            if (i < 0) return;
            const copy: Step = JSON.parse(JSON.stringify(s.mockup.steps[i]));
            copy.id = nextStepId(s.mockup);
            copy.title += ' (kopia)';
            copy.sections.forEach((sec) => {
              sec.id = uid('sec');
              sec.rows.flat().forEach((e) => {
                e.id = uid(e.kind === 'column' ? 'col' : 'el');
                if (e.kind === 'column') e.items.forEach((x) => (x.id = uid('el')));
              });
            });
            s.mockup.steps.splice(i + 1, 0, copy);
            s.activeStepId = copy.id;
          }),
        addTransition: (stepId) =>
          set((s) => {
            const st = s.mockup.steps.find((x) => x.id === stepId);
            if (!st) return;
            st.transitions ??= [];
            st.transitions.push({ label: 'Przycisk', variant: 'outline', align: 'left' });
          }),
        updateTransition: (stepId, idx, p) =>
          set((s) => {
            const t = s.mockup.steps.find((x) => x.id === stepId)?.transitions?.[idx];
            if (t) Object.assign(t, p);
          }),
        removeTransition: (stepId, idx) =>
          set((s) => {
            s.mockup.steps.find((x) => x.id === stepId)?.transitions?.splice(idx, 1);
          }),

        addSection: (stepId) =>
          set((s) => {
            const st = s.mockup.steps.find((x) => x.id === stepId);
            if (!st) return;
            const sec = newSection(`Sekcja ${st.sections.length + 1}`);
            st.sections.push(sec);
            s.selection = { type: 'section', sectionId: sec.id };
          }),
        updateSection: (id, p) =>
          set((s) => {
            const loc = locateSection(s.mockup, id);
            if (loc) Object.assign(loc.step.sections[loc.index], p);
          }),
        removeSection: (id) =>
          set((s) => {
            const loc = locateSection(s.mockup, id);
            if (!loc) return;
            loc.step.sections.splice(loc.index, 1);
            s.selection = { type: 'none' };
          }),
        moveSection: (id, dir) =>
          set((s) => {
            const loc = locateSection(s.mockup, id);
            if (!loc) return;
            const a = loc.step.sections;
            const j = loc.index + dir;
            if (j < 0 || j >= a.length) return;
            [a[loc.index], a[j]] = [a[j], a[loc.index]];
          }),
        addRow: (sectionId) =>
          set((s) => {
            const loc = locateSection(s.mockup, sectionId);
            loc?.step.sections[loc.index].rows.push([]);
          }),
        removeRow: (sectionId, rowIndex) =>
          set((s) => {
            const loc = locateSection(s.mockup, sectionId);
            if (!loc) return;
            const sec = loc.step.sections[loc.index];
            sec.rows.splice(rowIndex, 1);
            if (sec.rows.length === 0) sec.rows.push([]);
          }),

        addElement: (sectionId, rowIndex, kind, init, columnId) =>
          set((s) => {
            const loc = locateSection(s.mockup, sectionId);
            if (!loc) return;
            const sec = loc.step.sections[loc.index];
            if (columnId) {
              const col = sec.rows.flat().find((e) => e.id === columnId);
              if (col?.kind !== 'column') return;
              const el = { ...newElement(kind, 12), ...init, span: 12 } as Element;
              (col.items as Element[]).push(el);
              s.selection = { type: 'element', elementId: el.id };
              return;
            }
            let row = sec.rows[rowIndex];
            if (!row) {
              row = [];
              sec.rows.push(row);
            }
            let free = 12 - rowUsed(row);
            if (free <= 0) {
              sec.rows.splice(rowIndex + 1, 0, []);
              row = sec.rows[rowIndex + 1];
              free = 12;
            }
            const el = { ...newElement(kind, free), ...init } as Element;
            row.push(el);
            s.selection = { type: 'element', elementId: el.id };
          }),
        addColumn: (sectionId, rowIndex) =>
          set((s) => {
            const loc = locateSection(s.mockup, sectionId);
            const row = loc?.step.sections[loc.index].rows[rowIndex];
            if (!row || row.length >= 12) return;
            const col = newColumn(1);
            row.push(col);
            // równy podział wiersza między wszystkie kolumny / elementy
            evenSpans(row.length).forEach((span, i) => (row[i].span = span));
            s.selection = { type: 'element', elementId: col.id };
          }),
        splitRow: (sectionId, rowIndex, n) =>
          set((s) => {
            const loc = locateSection(s.mockup, sectionId);
            const sec = loc?.step.sections[loc.index];
            if (!sec || !sec.rows[rowIndex]) return;
            const existing = sec.rows[rowIndex].flatMap((e) => (e.kind === 'column' ? e.items : [e]));
            const cols = evenSpans(n).map((span) => newColumn(span));
            // dotychczasowe elementy trafiają do pierwszej kolumny
            cols[0].items = existing.map((e) => ({ ...e, span: 12 }));
            sec.rows[rowIndex] = cols;
          }),
        moveRow: (sectionId, rowIndex, dir) =>
          set((s) => {
            const loc = locateSection(s.mockup, sectionId);
            const rows = loc?.step.sections[loc.index].rows;
            const j = rowIndex + dir;
            if (!rows || j < 0 || j >= rows.length) return;
            [rows[rowIndex], rows[j]] = [rows[j], rows[rowIndex]];
          }),
        updateElement: (id, p) =>
          set((s) => {
            const loc = locateElement(s.mockup, id);
            if (!loc) return;
            const el = loc.list[loc.index] as Record<string, unknown>;
            for (const [k, v] of Object.entries(p)) {
              if (v === undefined || v === '') delete el[k];
              else el[k] = v;
            }
          }),
        removeElement: (id) =>
          set((s) => {
            const loc = locateElement(s.mockup, id);
            if (!loc) return;
            loc.list.splice(loc.index, 1);
            if (s.selection.type === 'element' && s.selection.elementId === id) s.selection = { type: 'none' };
          }),
        duplicateElement: (id) =>
          set((s) => {
            const loc = locateElement(s.mockup, id);
            if (!loc) return;
            const copy = cloneWithIds(loc.list[loc.index]);
            const row = loc.section.rows[loc.rowIndex];
            if (loc.column) loc.list.splice(loc.index + 1, 0, copy);
            else if (rowUsed(row) + copy.span <= 12) row.splice(loc.index + 1, 0, copy);
            else loc.section.rows.splice(loc.rowIndex + 1, 0, [copy]);
            s.selection = { type: 'element', elementId: copy.id };
          }),
        moveElement: (id, sectionId, rowIndex, index, columnId) =>
          set((s) => {
            const from = locateElement(s.mockup, id);
            const to = locateSection(s.mockup, sectionId);
            if (!from || !to) return;
            const moving = from.list[from.index];
            const target = to.step.sections[to.index];
            if (columnId) {
              if (moving.kind === 'column' || moving.id === columnId) return; // bez kolumn w kolumnach
              const col = target.rows.flat().find((e) => e.id === columnId);
              if (col?.kind !== 'column') return;
              from.list.splice(from.index, 1);
              let at = index;
              if (from.column?.id === columnId && from.index < index) at--;
              (col.items as Element[]).splice(Math.max(0, Math.min(at, col.items.length)), 0, { ...moving, span: 12 } as Element);
              return;
            }
            const [el] = from.list.splice(from.index, 1);
            const row = target.rows[rowIndex] ?? (target.rows[rowIndex] = []);
            let insertAt = index;
            if (!from.column && from.section.id === sectionId && from.rowIndex === rowIndex && from.index < index) insertAt--;
            if (from.column) el.span = Math.max(1, Math.min(12 - rowUsed(row), 6));
            const free = 12 - rowUsed(row);
            if (free <= 0) {
              if (from.column) el.span = 12;
              target.rows.splice(rowIndex + 1, 0, [el]);
            } else {
              el.span = Math.min(el.span, free);
              row.splice(Math.max(0, Math.min(insertAt, row.length)), 0, el);
            }
          }),
        moveElementToNewRow: (id, sectionId, rowIndex) =>
          set((s) => {
            const from = locateElement(s.mockup, id);
            const to = locateSection(s.mockup, sectionId);
            if (!from || !to) return;
            const [el] = from.list.splice(from.index, 1);
            if (from.column) el.span = 12;
            to.step.sections[to.index].rows.splice(rowIndex, 0, [el]);
          }),

        addEntity: () =>
          set((s) => {
            let n = s.mockup.data.length + 1;
            while (s.mockup.data.some((e) => e.entity === `entity${n}`)) n++;
            s.mockup.data.push({ entity: `entity${n}`, label: `Encja ${n}`, fields: [] });
          }),
        updateEntity: (idx, p) =>
          set((s) => {
            const e = s.mockup.data[idx];
            if (!e) return;
            const oldName = e.entity;
            Object.assign(e, p);
            if (p.entity && p.entity !== oldName) {
              // przepnij bindy
              for (const el of s.mockup.steps.flatMap((st) => st.sections.flatMap(sectionLeaves))) {
                if (el.kind === 'field' && el.bind?.startsWith(oldName + '.')) el.bind = p.entity + el.bind.slice(oldName.length);
                if (el.kind === 'table' && el.entity === oldName) el.entity = p.entity;
              }
            }
          }),
        removeEntity: (idx) => set((s) => void s.mockup.data.splice(idx, 1)),
        addField: (entityIdx, f) => {
          let id = '';
          set((s) => {
            const e = s.mockup.data[entityIdx];
            if (!e) return;
            let n = e.fields.length + 1;
            id = f?.id ?? `field${n}`;
            while (e.fields.some((x) => x.id === id)) id = `field${++n}`;
            e.fields.push({ label: 'Nowe pole', type: 'text', ...f, id });
          });
          return id;
        },
        updateField: (entityIdx, fieldIdx, p) =>
          set((s) => {
            const e = s.mockup.data[entityIdx];
            const f = e?.fields[fieldIdx];
            if (!f) return;
            const oldId = f.id;
            for (const [k, v] of Object.entries(p)) {
              if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) delete (f as Record<string, unknown>)[k];
              else (f as Record<string, unknown>)[k] = v;
            }
            if (p.id && p.id !== oldId) {
              const from = `${e.entity}.${oldId}`;
              for (const el of s.mockup.steps.flatMap((st) => st.sections.flatMap(sectionLeaves))) {
                if (el.kind === 'field' && el.bind === from) el.bind = `${e.entity}.${p.id}`;
              }
            }
          }),
        removeField: (entityIdx, fieldIdx) => set((s) => void s.mockup.data[entityIdx]?.fields.splice(fieldIdx, 1)),

        setTheme: (p) => set((s) => void Object.assign(s.mockup.theme, p, { preset: p.preset ?? 'custom' })),
        setColor: (key, hex) =>
          set((s) => {
            s.mockup.theme.colors[key] = hex;
            s.mockup.theme.preset = 'custom';
          }),
        applyPreset: (name) =>
          set((s) => {
            const p = THEME_PRESETS[name];
            // linki do wzorców kontrolek nie zależą od presetu kolorów — zachowujemy je
            if (p) s.mockup.theme = { ...structuredClone(p), controlRefs: s.mockup.theme.controlRefs, customCss: s.mockup.theme.customCss };
          }),
        setControlRef: (control, url) =>
          set((s) => {
            const refs = (s.mockup.theme.controlRefs ??= {});
            if (url.trim()) refs[control] = url.trim();
            else delete refs[control];
            if (Object.keys(refs).length === 0) delete s.mockup.theme.controlRefs;
          }),
      };
    }),
    {
      partialize: (s) => ({ mockup: s.mockup }),
      limit: 200,
      equality: (a, b) => a.mockup === b.mockup,
    },
  ),
);

// autosave
let t: ReturnType<typeof setTimeout> | undefined;
useMockup.subscribe((s, prev) => {
  if (s.mockup === prev.mockup) return;
  clearTimeout(t);
  t = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s.mockup));
    } catch {
      /* ignore */
    }
  }, 300);
});

export const undo = () => useMockup.temporal.getState().undo();
export const redo = () => useMockup.temporal.getState().redo();
