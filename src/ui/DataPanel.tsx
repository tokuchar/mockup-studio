import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { SEMANTIC_TYPES, type SemanticType } from '../model/schema';
import { SEMANTIC_LABELS } from '../model/controls';
import { useMockup } from '../store/useMockup';

export function DataPanel() {
  const data = useMockup((s) => s.mockup.data);
  const { addEntity, updateEntity, removeEntity, addField, updateField, removeField } = useMockup.getState();
  const [openField, setOpenField] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="px-1 text-xs leading-relaxed text-slate-500">
        Zdefiniuj dane wizarda (encje i pola). Pola formularza wybierają z tej listy w dropdownie „Dane”.
      </p>
      {data.map((e, ei) => (
        <div key={ei} className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 p-2">
            <input
              className="ed-input !w-28 font-mono !text-xs"
              value={e.entity}
              onChange={(ev) => updateEntity(ei, { entity: ev.target.value.replace(/[^\w]/g, '') || e.entity })}
              title="Identyfikator encji"
            />
            <input
              className="ed-input !text-xs"
              value={e.label ?? ''}
              placeholder="Nazwa"
              onChange={(ev) => updateEntity(ei, { label: ev.target.value })}
            />
            <button
              className="ed-icon-btn flex-none hover:!text-red-600"
              onClick={() => confirm(`Usunąć encję ${e.entity}?`) && removeEntity(ei)}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex flex-col p-1">
            {e.fields.map((f, fi) => {
              const key = `${ei}.${fi}`;
              const open = openField === key;
              return (
                <div key={fi} className="rounded-lg hover:bg-slate-50">
                  <div className="flex cursor-pointer items-center gap-1.5 px-1.5 py-1.5" onClick={() => setOpenField(open ? null : key)}>
                    {open ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
                    <span className="flex-1 truncate text-sm text-slate-700">
                      {f.label}
                      {f.required && <span className="text-red-500"> *</span>}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{f.type}</span>
                  </div>
                  {open && (
                    <div className="grid grid-cols-2 gap-2 px-2 pb-3 pt-1">
                      <div>
                        <label className="ed-label">id</label>
                        <input
                          className="ed-input font-mono !text-xs"
                          value={f.id}
                          onChange={(ev) => updateField(ei, fi, { id: ev.target.value.replace(/[^\w]/g, '') || f.id })}
                        />
                      </div>
                      <div>
                        <label className="ed-label">Etykieta</label>
                        <input className="ed-input" value={f.label} onChange={(ev) => updateField(ei, fi, { label: ev.target.value || ' ' })} />
                      </div>
                      <div className="col-span-2">
                        <label className="ed-label">Typ danych</label>
                        <select className="ed-input" value={f.type} onChange={(ev) => updateField(ei, fi, { type: ev.target.value as SemanticType })}>
                          {SEMANTIC_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t} — {SEMANTIC_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="ed-label">Źródło (opcjonalnie)</label>
                        <input
                          className="ed-input"
                          placeholder="np. GUS po NIP, słownik X, wynik kroku 1"
                          value={f.source ?? ''}
                          onChange={(ev) => updateField(ei, fi, { source: ev.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="ed-label">Słownik z backendu (opcjonalnie)</label>
                        <input
                          className="ed-input font-mono !text-xs"
                          placeholder="np. CEL_KREDYTU"
                          value={f.dictionary ?? ''}
                          onChange={(ev) => updateField(ei, fi, { dictionary: ev.target.value.toUpperCase().replace(/[^\w.-]/g, '_') })}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="ed-label">Opcje (po jednej w linii)</label>
                        <textarea
                          className="ed-input"
                          rows={2}
                          value={(f.options ?? []).join('\n')}
                          onChange={(ev) => updateField(ei, fi, { options: ev.target.value.split('\n').filter((x, i, a) => x || i === a.length - 1) })}
                        />
                      </div>
                      <label className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={!!f.required} onChange={(ev) => updateField(ei, fi, { required: ev.target.checked || undefined })} />
                        Wymagane
                      </label>
                      <button className="ed-btn col-span-2 justify-center !text-red-600 hover:!bg-red-50" onClick={() => removeField(ei, fi)}>
                        <Trash2 size={13} /> Usuń pole
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <button
              className="ed-btn justify-center !text-xs text-indigo-600"
              onClick={() => {
                addField(ei);
                setOpenField(`${ei}.${e.fields.length}`);
              }}
            >
              <Plus size={13} /> pole
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addEntity}
        className="flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
      >
        <Plus size={16} /> Encja danych
      </button>
    </div>
  );
}
