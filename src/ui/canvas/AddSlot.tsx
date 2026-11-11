import { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  Bell,
  Calendar,
  CircleDot,
  Coins,
  Database,
  LayoutGrid,
  ListChecks,
  ListFilter,
  MousePointerClick,
  Paperclip,
  Plus,
  Search,
  Hash,
  Tags,
  Sparkles,
  SquareCheck,
  Table2,
  TextCursorInput,
  ToggleRight,
  Type,
} from 'lucide-react';
import { ELEMENT_KINDS } from '../../model/defaults';
import type { ControlType, ElementKind } from '../../model/schema';
import { useMockup } from '../../store/useMockup';

const ICONS: Record<ElementKind, typeof Plus> = {
  field: TextCursorInput,
  text: AlignLeft,
  info: Bell,
  button: MousePointerClick,
  table: Table2,
  placeholder: Sparkles,
};

const QUICK_FIELDS: { control: ControlType; label: string; icon: typeof Plus; options?: string[] }[] = [
  { control: 'inputText', label: 'InputText', icon: TextCursorInput },
  { control: 'dropdown', label: 'Dropdown', icon: ListFilter },
  { control: 'autoComplete', label: 'AutoComplete', icon: Search },
  { control: 'multiSelect', label: 'MultiSelect', icon: ListChecks },
  { control: 'checkbox', label: 'Checkbox', icon: SquareCheck },
  { control: 'checkbox', label: 'Checkboxy (grupa)', icon: ListChecks, options: ['Opcja 1', 'Opcja 2', 'Opcja 3'] },
  { control: 'radioButton', label: 'RadioButton', icon: CircleDot },
  { control: 'selectButton', label: 'SelectButton', icon: LayoutGrid },
  { control: 'inputSwitch', label: 'InputSwitch', icon: ToggleRight },
  { control: 'calendar', label: 'Calendar', icon: Calendar },
  { control: 'inputNumber', label: 'InputNumber', icon: Coins },
  { control: 'inputMask', label: 'InputMask', icon: Hash },
  { control: 'inputTextarea', label: 'InputTextarea', icon: Type },
  { control: 'fileUpload', label: 'FileUpload', icon: Paperclip },
  { control: 'chips', label: 'Chips', icon: Tags },
];

/** Pusty slot w wierszu: „+” otwiera menu elementów (jak w PowerPoincie). */
export function AddSlot({ sectionId, rowIndex, span, columnId }: { sectionId: string; rowIndex: number; span: number; columnId?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const addElement = useMockup((s) => s.addElement);
  const data = useMockup((s) => s.mockup.data);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const add = (kind: ElementKind, init?: Record<string, unknown>) => {
    addElement(sectionId, rowIndex, kind, init, columnId);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" style={columnId ? undefined : { gridColumn: `span ${span}` }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`group flex h-full ${columnId ? 'min-h-[44px]' : 'min-h-[64px]'} w-full items-center justify-center rounded-xl border-[1.5px] border-dashed border-indigo-300/60 bg-indigo-50/30 text-indigo-400 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600`}
        title="Dodaj element"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold opacity-70 group-hover:opacity-100">
          <Plus size={16} /> {columnId ? 'Dodaj do kolumny' : span < 12 ? `${span} kol.` : 'Dodaj element'}
        </span>
      </button>
      {open && (
        <div
          className="absolute left-1/2 top-full z-30 mt-2 max-h-[70vh] w-[380px] -translate-x-1/2 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl"
          style={{ fontFamily: 'Inter, system-ui' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kontrolki PrimeNG 17</div>
          <div className="grid grid-cols-3 gap-1">
            {QUICK_FIELDS.map(({ control, label, icon: Icon, options }) => (
              <button
                key={label}
                onClick={() => add('field', { control, label, options })}
                className="flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Icon size={17} className="text-indigo-600" />
                {label}
              </button>
            ))}
          </div>
          <div className="mt-1 border-t border-slate-100 px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Inne elementy</div>
          <div className="grid grid-cols-2 gap-0.5">
            {ELEMENT_KINDS.filter((k) => k.kind !== 'field').map(({ kind, label, desc }) => {
              const Icon = ICONS[kind];
              return (
                <button key={kind} onClick={() => add(kind)} title={desc} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-semibold hover:bg-slate-50">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                    <Icon size={14} />
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
          {data.some((e) => e.fields.length) && (
            <div className="mt-1 border-t border-slate-100 pt-1.5">
              <div className="flex items-center gap-1.5 px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <Database size={12} /> Szybko: pole z danych
              </div>
              <div className="max-h-48 overflow-auto">
                {data.map((e) =>
                  e.fields.map((f) => (
                    <button
                      key={`${e.entity}.${f.id}`}
                      onClick={() => add('field', { bind: `${e.entity}.${f.id}`, label: undefined })}
                      className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-slate-50"
                    >
                      <span>{f.label}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {e.entity}.{f.id}
                      </span>
                    </button>
                  )),
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
