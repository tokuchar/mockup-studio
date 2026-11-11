import { useRef, useState, type ReactNode } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Copy, GripVertical, Minus, Plus, Sparkles, Trash2, Zap } from 'lucide-react';
import type { Element } from '../../model/schema';
import { useMockup } from '../../store/useMockup';
import { ElementView } from '../controls/ElementView';

/**
 * Ramka edycyjna elementu: zaznaczanie, przeciąganie, zmiana szerokości.
 * `inColumn` — element w kolumnie (pełna szerokość kolumny, bez zmiany span).
 * `children` — zawartość kontenera (kolumny); wtedy przeciąga się tylko za uchwyt.
 */
export function ElementBox({ el, maxSpan, inColumn, children }: { el: Element; maxSpan: number; inColumn?: boolean; children?: ReactNode }) {
  const mockup = useMockup((s) => s.mockup);
  const mode = useMockup((s) => s.mode);
  const selected = useMockup((s) => s.selection.type === 'element' && s.selection.elementId === el.id);
  const { select, updateElement, removeElement, duplicateElement } = useMockup.getState();
  const [dragSpan, setDragSpan] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const drag = useDraggable({ id: el.id, disabled: mode !== 'edit' });
  const drop = useDroppable({ id: `before:${el.id}`, disabled: mode !== 'edit' });

  const span = dragSpan ?? el.span;

  if (mode === 'preview') {
    return <div style={inColumn ? undefined : { gridColumn: `span ${el.span}` }}>{children ?? <ElementView el={el} mockup={mockup} />}</div>;
  }

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const row = boxRef.current?.parentElement;
    if (!row) return;
    const colW = row.clientWidth / 12;
    const startX = e.clientX;
    const start = el.span;
    let current = start;
    const move = (ev: PointerEvent) => {
      current = Math.max(1, Math.min(maxSpan, start + Math.round((ev.clientX - startX) / colW)));
      setDragSpan(current);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDragSpan(null);
      if (current !== start) updateElement(el.id, { span: current });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const hasActions = (el.kind === 'field' || el.kind === 'button') && !!el.on?.length;
  const aiHint = el.aiHint;

  return (
    <div
      ref={(n) => {
        boxRef.current = n;
        drag.setNodeRef(n);
        drop.setNodeRef(n);
      }}
      {...(children ? {} : drag.listeners)}
      {...(children ? {} : drag.attributes)}
      style={inColumn ? undefined : { gridColumn: `span ${span}` }}
      className={`el-edit ${children ? 'el-container' : ''} ${selected ? 'selected' : ''} ${drag.isDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        select({ type: 'element', elementId: el.id });
      }}
    >
      {drop.isOver && !drag.isDragging &&
        (inColumn ? (
          <div className="absolute -top-[7px] left-0 right-0 z-20 h-[3px] rounded-full bg-indigo-500" />
        ) : (
          <div className="absolute -left-[9px] bottom-0 top-0 z-20 w-[3px] rounded-full bg-indigo-500" />
        ))}
      {children ?? (
        <div className="el-inner">
          <ElementView el={el} mockup={mockup} />
        </div>
      )}

      {(aiHint || hasActions) && (
        <div className="absolute -right-2 -top-2.5 z-10 flex gap-1">
          {hasActions && (
            <span title="Ma akcje" className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white shadow">
              <Zap size={11} />
            </span>
          )}
          {aiHint && (
            <span title={`AI: ${aiHint}`} className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white shadow">
              <Sparkles size={11} />
            </span>
          )}
        </div>
      )}

      {selected && (
        <>
          <div
            className="absolute -top-[38px] left-0 z-20 flex items-center gap-0.5 rounded-lg bg-slate-900 px-1 py-0.5 text-white shadow-lg"
            style={{ fontFamily: 'Inter, system-ui' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              {...(children ? drag.listeners : {})}
              {...(children ? drag.attributes : {})}
              className="cursor-grab p-1 text-slate-300 hover:text-white"
              title="Przeciągnij"
            >
              <GripVertical size={14} />
            </span>
            {children && <span className="px-1 text-[11px] font-semibold">Kolumna</span>}
            {!inColumn && (
              <>
                <button className="p-1 hover:text-indigo-300" title="Węższy" onClick={() => updateElement(el.id, { span: Math.max(1, el.span - 1) })}>
                  <Minus size={13} />
                </button>
                <span className="min-w-[38px] text-center text-[11px] font-semibold tabular-nums">{span}/12</span>
                <button className="p-1 hover:text-indigo-300" title="Szerszy" onClick={() => updateElement(el.id, { span: Math.min(maxSpan, el.span + 1) })}>
                  <Plus size={13} />
                </button>
              </>
            )}
            <span className="mx-0.5 h-4 w-px bg-slate-700" />
            <button className="p-1 hover:text-indigo-300" title="Duplikuj" onClick={() => duplicateElement(el.id)}>
              <Copy size={13} />
            </button>
            <button className="p-1 hover:text-red-400" title="Usuń (Delete)" onClick={() => removeElement(el.id)}>
              <Trash2 size={13} />
            </button>
          </div>
          {!inColumn && <div
            onPointerDown={startResize}
            className="absolute -right-[9px] top-1/2 z-20 h-8 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-indigo-600 shadow"
            title="Przeciągnij, aby zmienić szerokość"
          />}
        </>
      )}
    </div>
  );
}
