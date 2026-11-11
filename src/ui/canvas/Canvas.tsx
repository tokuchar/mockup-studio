import { useState, type CSSProperties } from 'react';
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Columns3, Zap, Check, Plus, Trash2, X } from 'lucide-react';
import { transitionAlign, type ColumnElement, type Element, type Section, type Step, type Transition } from '../../model/schema';
import { rowUsed } from '../../model/defaults';
import { themeToCssVars } from '../../model/themes';
import { styleToCss } from '../../model/style';
import { locateElement, useMockup } from '../../store/useMockup';
import { ElementBox } from './ElementBox';
import { AddSlot } from './AddSlot';
import { ElementView } from '../controls/ElementView';

/** Najmniejszy obszar pod kursorem wygrywa — dzięki temu upuszczenie w kolumnie trafia do kolumny, a nie przed nią. */
const smallestUnderPointer: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (!hits.length) return rectIntersection(args);
  const area = (id: string | number) => {
    const r = args.droppableRects.get(id);
    const base = r ? r.width * r.height : Infinity;
    // „przed kolumną” ma ten sam obszar co wnętrze kolumny — wnętrze (col:) ma pierwszeństwo
    return String(id).startsWith('before:col-') ? base * 1.05 : base;
  };
  return [...hits].sort((a, b) => area(a.id) - area(b.id));
};

export function Canvas() {
  const mockup = useMockup((s) => s.mockup);
  const activeStepId = useMockup((s) => s.activeStepId);
  const mode = useMockup((s) => s.mode);
  const { select, setActiveStep, moveElement, moveElementToNewRow, addSection } = useMockup.getState();
  const [dragging, setDragging] = useState<Element | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const stepIdx = Math.max(0, mockup.steps.findIndex((s) => s.id === activeStepId));
  const step = mockup.steps[stepIdx];
  const vars = themeToCssVars(mockup.theme) as CSSProperties;

  const onDragStart = (e: DragStartEvent) => {
    const loc = locateElement(mockup, String(e.active.id));
    setDragging(loc ? loc.list[loc.index] : null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const over = String(e.over.id);
    if (over.startsWith('before:')) {
      const target = over.slice(7);
      if (target === id) return;
      const loc = locateElement(mockup, target);
      if (loc) moveElement(id, loc.section.id, loc.rowIndex, loc.index, loc.column?.id);
    } else if (over.startsWith('col:')) {
      const [, sec, row, colId] = over.split(':');
      const col = locateElement(mockup, colId);
      const items = col && col.list[col.index].kind === 'column' ? (col.list[col.index] as { items: unknown[] }).items : [];
      moveElement(id, sec, +row, items.length, colId);
    } else if (over.startsWith('row:')) {
      const [, sec, row] = over.split(':');
      const target = locateSection(step, sec);
      moveElement(id, sec, +row, target?.rows[+row]?.length ?? 0);
    } else if (over.startsWith('newrow:')) {
      const [, sec, row] = over.split(':');
      moveElementToNewRow(id, sec, +row);
    }
  };

  if (!step) return null;

  return (
    <div
      id="ms-canvas"
      className="ms-canvas min-h-full px-10 pb-24 pt-8"
      style={vars}
      onClick={() => mode === 'edit' && select({ type: 'step', stepId: step.id })}
    >
      {mockup.theme.customCss && <style>{mockup.theme.customCss}</style>}
      <div className="mx-auto max-w-[920px]">
        {/* stepper */}
        <div className="ms-stepper mb-8">
          {mockup.steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <span className="ms-step-line" />}
              <div
                className={`ms-step ${i === stepIdx ? 'on' : i < stepIdx ? 'done' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(s.id);
                  if (mode === 'edit') select({ type: 'step', stepId: s.id });
                }}
              >
                <span className="num" style={s.optional ? { borderStyle: 'dashed', borderWidth: 2 } : undefined}>
                  {i < stepIdx ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span className="flex flex-col leading-tight">
                  {s.title}
                  {s.optional && <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--c-muted)' }}>opcjonalny</span>}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-primary)' }}>
            Krok {stepIdx + 1} z {mockup.steps.length}
            {step.optional && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 normal-case tracking-normal"
                style={{ background: 'color-mix(in srgb, var(--c-warning) 14%, transparent)', color: 'var(--c-warning)' }}
              >
                opcjonalny
              </span>
            )}
          </div>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight">{step.title}</h1>
          {step.purpose && (
            <p className="mt-1 text-[14.5px]" style={{ color: 'var(--c-muted)' }}>
              {step.purpose}
            </p>
          )}
          {(step.optional || step.when) && <StepTrigger step={step} steps={mockup.steps} />}
        </div>

        <DndContext sensors={sensors} collisionDetection={smallestUnderPointer} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <div className="flex flex-col" style={{ gap: 'var(--gap)' }}>
            {step.sections.map((sec, i) => (
              <SectionView key={sec.id} section={sec} index={i} count={step.sections.length} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {dragging && (
              <div className="ms-canvas pointer-events-none w-[320px] rounded-xl bg-white/90 p-3 opacity-90 shadow-2xl ring-2 ring-indigo-500" style={vars}>
                <ElementView el={dragging} mockup={mockup} />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {mode === 'edit' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addSection(step.id);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300/70 py-4 text-sm font-semibold text-slate-400 transition hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-600"
            style={{ fontFamily: 'Inter, system-ui' }}
          >
            <Plus size={16} /> Dodaj sekcję
          </button>
        )}

        <Transitions step={step} />
      </div>
    </div>
  );
}

/** Pasek „kiedy krok się uruchamia” nad treścią kroku. */
function StepTrigger({ step, steps }: { step: Step; steps: Step[] }) {
  const idx = steps.findIndex((s) => s.id === step.id);
  const skip = steps.find((s) => s.id === step.skipTo) ?? steps.slice(idx + 1).find((s) => !s.optional);
  const mode = useMockup((s) => s.mode);
  const missing = step.optional && !step.when;
  return (
    <div
      className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-[13.5px]"
      style={{
        border: `1px ${step.optional ? 'dashed' : 'solid'} color-mix(in srgb, var(--c-warning) 45%, var(--c-border))`,
        background: 'color-mix(in srgb, var(--c-warning) 7%, var(--c-surface))',
        fontFamily: mode === 'edit' ? 'Inter, system-ui' : undefined,
      }}
    >
      <Zap size={16} style={{ color: 'var(--c-warning)', flex: 'none', marginTop: 2 }} />
      <div>
        <div style={{ fontWeight: 600 }}>
          {step.optional ? 'Krok opcjonalny — uruchamia się, gdy: ' : 'Uruchamia się: '}
          <span style={{ fontWeight: 500, color: missing ? 'var(--c-error)' : undefined }}>{step.when || 'nie opisano warunku'}</span>
        </div>
        {step.optional && (
          <div style={{ color: 'var(--c-muted)', marginTop: 2 }}>
            W przeciwnym razie przejście do: <b>{skip ? `${skip.title} (${skip.id})` : 'koniec wizarda'}</b>
          </div>
        )}
      </div>
    </div>
  );
}

function locateSection(step: Step, id: string) {
  return step.sections.find((s) => s.id === id);
}

function SectionView({ section, index, count }: { section: Section; index: number; count: number }) {
  const mode = useMockup((s) => s.mode);
  const selected = useMockup((s) => s.selection.type === 'section' && s.selection.sectionId === section.id);
  const theme = useMockup((s) => s.mockup.theme);
  const { select, addRow, moveSection, removeSection } = useMockup.getState();
  const edit = mode === 'edit';

  return (
    <section
      className={`ms-card ${section.emphasis ?? ''} relative`}
      style={{
        padding: 'calc(var(--gap) + 4px)',
        ...styleToCss(theme, section.style),
        outline: selected ? '2px solid rgb(79 70 229)' : undefined,
        outlineOffset: 3,
      }}
      onClick={(e) => {
        if (!edit) return;
        e.stopPropagation();
        select({ type: 'section', sectionId: section.id });
      }}
    >
      {edit && (
        <div
          className="absolute right-3 top-3 flex gap-0.5 rounded-lg bg-white/80 opacity-60 backdrop-blur transition hover:opacity-100"
          style={{ fontFamily: 'Inter, system-ui' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="ed-icon-btn" disabled={index === 0} onClick={() => moveSection(section.id, -1)} title="W górę">
            <ArrowUp size={14} />
          </button>
          <button className="ed-icon-btn" disabled={index === count - 1} onClick={() => moveSection(section.id, 1)} title="W dół">
            <ArrowDown size={14} />
          </button>
          <button className="ed-icon-btn hover:!text-red-600" onClick={() => removeSection(section.id)} title="Usuń sekcję">
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {(section.title || section.description) && (
        <div className="mb-5 pr-24">
          {section.title && <h2 className="text-[17px] font-semibold tracking-tight">{section.title}</h2>}
          {section.description && (
            <p className="mt-0.5 text-[13.5px]" style={{ color: 'var(--c-muted)' }}>
              {section.description}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col" style={{ gap: 'calc(var(--gap) - 2px)' }}>
        {section.rows.map((row, r) => (
          <div key={r}>
            {edit && <NewRowDrop sectionId={section.id} rowIndex={r} />}
            <Row sectionId={section.id} rowIndex={r} row={row} rowCount={section.rows.length} />
          </div>
        ))}
        {edit && <NewRowDrop sectionId={section.id} rowIndex={section.rows.length} />}
      </div>
      {edit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addRow(section.id);
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
          style={{ fontFamily: 'Inter, system-ui' }}
        >
          <Plus size={14} /> wiersz
        </button>
      )}
    </section>
  );
}

function NewRowDrop({ sectionId, rowIndex }: { sectionId: string; rowIndex: number }) {
  const { setNodeRef, isOver, active } = useDroppable({ id: `newrow:${sectionId}:${rowIndex}` });
  if (!active) return null;
  return (
    <div ref={setNodeRef} className="-my-1 py-1">
      <div className={`h-1 rounded-full transition ${isOver ? 'bg-indigo-500' : 'bg-transparent'}`} />
    </div>
  );
}

function Row({ sectionId, rowIndex, row, rowCount }: { sectionId: string; rowIndex: number; row: Element[]; rowCount: number }) {
  const mode = useMockup((s) => s.mode);
  const { removeRow, addColumn, splitRow, moveRow } = useMockup.getState();
  const { setNodeRef, isOver } = useDroppable({ id: `row:${sectionId}:${rowIndex}`, disabled: mode !== 'edit' });
  const free = 12 - rowUsed(row);
  const edit = mode === 'edit';

  if (!edit && row.length === 0) return null;

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className="group/row relative">
      {edit && (
        <div
          className="absolute -top-3.5 right-0 z-30 hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 text-slate-500 shadow-md group-hover/row:flex"
          style={{ fontFamily: 'Inter, system-ui' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Wiersz {rowIndex + 1}</span>
          <button className="ed-icon-btn !h-6 !w-6" disabled={rowIndex === 0} onClick={stop(() => moveRow(sectionId, rowIndex, -1))} title="Wiersz w górę">
            <ArrowUp size={13} />
          </button>
          <button className="ed-icon-btn !h-6 !w-6" disabled={rowIndex === rowCount - 1} onClick={stop(() => moveRow(sectionId, rowIndex, 1))} title="Wiersz w dół">
            <ArrowDown size={13} />
          </button>
          <span className="mx-0.5 h-4 w-px bg-slate-200" />
          <button
            className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold hover:bg-indigo-50 hover:text-indigo-700"
            onClick={stop(() => addColumn(sectionId, rowIndex))}
            title="Dodaj kolumnę (wiersz dzieli się równo)"
          >
            <Columns3 size={13} /> + kolumna
          </button>
          <span className="px-0.5 text-[10px] text-slate-400">podziel:</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className="h-6 min-w-[22px] rounded-md px-1 text-[11px] font-bold hover:bg-indigo-50 hover:text-indigo-700"
              onClick={stop(() => splitRow(sectionId, rowIndex, n))}
              title={`Podziel wiersz na ${n} kolumny${row.length ? ' (obecne elementy trafią do pierwszej)' : ''}`}
            >
              {n}
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-slate-200" />
          <button
            className="ed-icon-btn !h-6 !w-6 hover:!bg-red-50 hover:!text-red-600"
            onClick={stop(() => (row.length === 0 || confirm('Usunąć wiersz razem z zawartością?')) && removeRow(sectionId, rowIndex))}
            title="Usuń wiersz"
          >
            <X size={13} />
          </button>
        </div>
      )}
      <div
        ref={setNodeRef}
        className={`grid grid-cols-12 rounded-xl transition ${isOver ? 'bg-indigo-50/60' : ''} ${edit ? 'group-hover/row:bg-slate-500/[0.03]' : ''}`}
        style={{ columnGap: 'calc(var(--gap) - 4px)', rowGap: 'calc(var(--gap) - 4px)', alignItems: 'start' }}
      >
        {row.map((el) =>
          el.kind === 'column' ? (
            <ColumnBox key={el.id} col={el} sectionId={sectionId} rowIndex={rowIndex} maxSpan={el.span + Math.max(0, free)} />
          ) : (
            <ElementBox key={el.id} el={el} maxSpan={el.span + Math.max(0, free)} />
          ),
        )}
        {edit && free > 0 && <AddSlot sectionId={sectionId} rowIndex={rowIndex} span={free} />}
        {free < 0 && edit && (
          <div className="col-span-12 text-xs font-semibold text-red-600">Wiersz ma {12 - free}/12 kolumn — zmniejsz szerokość elementów</div>
        )}
      </div>
    </div>
  );
}

function ColumnBox({ col, sectionId, rowIndex, maxSpan }: { col: ColumnElement; sectionId: string; rowIndex: number; maxSpan: number }) {
  const mode = useMockup((s) => s.mode);
  const edit = mode === 'edit';
  const { setNodeRef, isOver } = useDroppable({ id: `col:${sectionId}:${rowIndex}:${col.id}`, disabled: !edit });
  const mockup = useMockup((s) => s.mockup);
  return (
    <ElementBox el={col} maxSpan={maxSpan}>
      {edit ? (
        <div
          ref={setNodeRef}
          className={`ms-column flex flex-col ${isOver ? '!border-indigo-500 !bg-indigo-50/60' : ''}`}
          style={{ gap: 'calc(var(--gap) - 4px)', ...styleToCss(mockup.theme, col.style) }}
        >
          {col.title && <div className="ms-label" style={{ marginBottom: 0 }}>{col.title}</div>}
          {col.items.map((x) => (
            <ElementBox key={x.id} el={x} maxSpan={12} inColumn />
          ))}
          <AddSlot sectionId={sectionId} rowIndex={rowIndex} span={12} columnId={col.id} />
        </div>
      ) : (
        <ElementView el={col} mockup={mockup} />
      )}
    </ElementBox>
  );
}

function Transitions({ step }: { step: Step }) {
  const mode = useMockup((s) => s.mode);
  const steps = useMockup((s) => s.mockup.steps);
  const { setActiveStep, select, addTransition, updateTransition } = useMockup.getState();
  const [toast, setToast] = useState<string | null>(null);
  const ts = (step.transitions ?? []).map((t, i) => ({ t, i }));
  const edit = mode === 'edit';
  const stepIdx = steps.findIndex((s) => s.id === step.id);

  const renderBtn = ({ t, i }: { t: Transition; i: number }) => {
    const side = transitionAlign(t);
    const toIdx = t.to ? steps.findIndex((s) => s.id === t.to) : -1;
    return (
      <div key={i} className="group/tr relative">
        <button
          className={`ms-btn ${t.variant ?? 'primary'}`}
          style={{ ['--btn' as string]: t.variant === 'danger' ? 'var(--c-error)' : 'var(--c-primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            if (edit) {
              select({ type: 'step', stepId: step.id });
              return;
            }
            if (t.to && toIdx >= 0) setActiveStep(t.to);
            else {
              setToast(t.do ?? t.label);
              setTimeout(() => setToast(null), 2200);
            }
          }}
          title={edit ? `${t.to ? `→ ${t.to}` : ''} ${t.do ?? ''} ${t.when ? `(gdy: ${t.when})` : ''}` : undefined}
        >
          {toIdx >= 0 && toIdx < stepIdx && <ArrowLeft size={15} />}
          {t.label}
          {toIdx > stepIdx && <ArrowRight size={15} />}
        </button>
        {edit && (
          <div
            className="absolute -top-9 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-0.5 rounded-lg bg-slate-900 px-1 py-0.5 text-white shadow-lg group-hover/tr:flex"
            style={{ fontFamily: 'Inter, system-ui' }}
          >
            <button
              className="rounded p-1 hover:text-indigo-300 disabled:opacity-30"
              disabled={side === 'left'}
              title="Przesuń na lewo"
              onClick={(e) => {
                e.stopPropagation();
                updateTransition(step.id, i, { align: 'left' });
              }}
            >
              <ArrowLeft size={13} />
            </button>
            <span className="px-0.5 text-[10px] font-semibold uppercase">{side === 'left' ? 'lewo' : 'prawo'}</span>
            <button
              className="rounded p-1 hover:text-indigo-300 disabled:opacity-30"
              disabled={side === 'right'}
              title="Przesuń na prawo"
              onClick={(e) => {
                e.stopPropagation();
                updateTransition(step.id, i, { align: 'right' });
              }}
            >
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative mt-8 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">{ts.filter(({ t }) => transitionAlign(t) === 'left').map(renderBtn)}</div>
      {edit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addTransition(step.id);
            select({ type: 'step', stepId: step.id });
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-400 hover:border-indigo-400 hover:text-indigo-600"
          style={{ fontFamily: 'Inter, system-ui' }}
        >
          <Plus size={14} /> przycisk / przejście
        </button>
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">{ts.filter(({ t }) => transitionAlign(t) === 'right').map(renderBtn)}</div>
      {toast && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
          style={{ fontFamily: 'Inter, system-ui' }}
        >
          Akcja: {toast}
        </div>
      )}
    </div>
  );
}
