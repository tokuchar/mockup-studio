import { AlertCircle, ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import { useMockup } from '../store/useMockup';
import { sectionLeaves } from '../model/defaults';
import type { Issue } from '../model/validate';

export function StepList({ issues }: { issues: Issue[] }) {
  const steps = useMockup((s) => s.mockup.steps);
  const active = useMockup((s) => s.activeStepId);
  const { setActiveStep, select, addStep, moveStep, removeStep, duplicateStep } = useMockup.getState();

  return (
    <div className="flex flex-col gap-1 p-3">
      {steps.map((s, i) => {
        const n = issues.filter((x) => x.stepId === s.id).length;
        const on = s.id === active;
        return (
          <div
            key={s.id}
            onClick={() => {
              setActiveStep(s.id);
              select({ type: 'step', stepId: s.id });
            }}
            className={`group flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition ${
              on ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
            }`}
          >
            <span
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg text-xs font-bold ${
                s.optional
                  ? on
                    ? 'border-2 border-dashed border-indigo-600 bg-white text-indigo-700'
                    : 'border-2 border-dashed border-slate-300 bg-white text-slate-500'
                  : on
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500'
              }`}
              title={s.optional ? 'Krok opcjonalny' : undefined}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-slate-800">{s.title || '(bez tytułu)'}</span>
                {s.optional && <span className="flex-none rounded bg-amber-100 px-1 text-[9.5px] font-bold uppercase text-amber-700">opcj.</span>}
              </div>
              {s.when && (
                <div className="truncate text-[11px] text-amber-700" title={s.when}>
                  ⚡ {s.when}
                </div>
              )}
              <div className="truncate text-[11px] text-slate-400">
                {s.id} · {s.sections.reduce((a, sec) => a + sectionLeaves(sec).length, 0)} el. · {(s.transitions ?? []).filter((t) => t.to).map((t) => `→${t.to}`).join(' ') || 'brak przejść'}
              </div>
            </div>
            {n > 0 && (
              <span title={`${n} problem(ów)`} className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 text-[11px] font-bold text-red-600">
                <AlertCircle size={11} /> {n}
              </span>
            )}
            <div className="hidden flex-col group-hover:flex" onClick={(e) => e.stopPropagation()}>
              <div className="flex">
                <button className="ed-icon-btn !h-5 !w-5" onClick={() => moveStep(s.id, -1)} title="W górę">
                  <ArrowUp size={12} />
                </button>
                <button className="ed-icon-btn !h-5 !w-5" onClick={() => moveStep(s.id, 1)} title="W dół">
                  <ArrowDown size={12} />
                </button>
              </div>
              <div className="flex">
                <button className="ed-icon-btn !h-5 !w-5" onClick={() => duplicateStep(s.id)} title="Duplikuj">
                  <Copy size={12} />
                </button>
                <button
                  className="ed-icon-btn !h-5 !w-5 hover:!text-red-600"
                  onClick={() => confirm(`Usunąć krok „${s.title}”?`) && removeStep(s.id)}
                  title="Usuń"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => addStep()}
          className="flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600"
        >
          <Plus size={16} /> Krok
        </button>
        <button
          onClick={() => addStep({ optional: true })}
          title="Krok pokazywany tylko, gdy spełniony jest warunek"
          className="flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-amber-300 py-2.5 text-sm font-semibold text-amber-600 transition hover:border-amber-400 hover:bg-amber-50/60"
        >
          <Plus size={16} /> Opcjonalny
        </button>
      </div>
    </div>
  );
}
