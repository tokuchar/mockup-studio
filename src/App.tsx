import { useMemo, useState } from 'react';
import { AlertCircle, Database, Layers, Palette, Sparkles } from 'lucide-react';
import { useMockup } from './store/useMockup';
import { validateMockup } from './model/validate';
import { Topbar } from './ui/Topbar';
import { StepList } from './ui/StepList';
import { DataPanel } from './ui/DataPanel';
import { ThemePanel } from './ui/ThemePanel';
import { Canvas } from './ui/canvas/Canvas';
import { Inspector } from './ui/inspector/Inspector';
import { ExportDialog } from './ui/ExportDialog';

type Tab = 'steps' | 'data' | 'theme' | 'ai';

export default function App() {
  const mockup = useMockup((s) => s.mockup);
  const mode = useMockup((s) => s.mode);
  const [tab, setTab] = useState<Tab>('steps');
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const issues = useMemo(() => validateMockup(mockup), [mockup]);

  const notify = (msg: string, error?: boolean) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), error ? 6000 : 2500);
  };

  const tabs: { id: Tab; label: string; icon: typeof Layers; badge?: number }[] = [
    { id: 'steps', label: 'Kroki', icon: Layers },
    { id: 'data', label: 'Dane', icon: Database },
    { id: 'theme', label: 'Wygląd', icon: Palette },
    { id: 'ai', label: 'AI', icon: Sparkles, badge: issues.length || undefined },
  ];

  return (
    <div className="flex h-full flex-col">
      <Topbar onExport={() => setExporting(true)} notify={notify} />
      <div className="flex min-h-0 flex-1">
        {mode === 'edit' && (
          <aside className="flex w-[290px] flex-none flex-col border-r border-slate-200 bg-white">
            <nav className="grid grid-cols-4 gap-0.5 border-b border-slate-100 p-1.5">
              {tabs.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
                    tab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {badge && <span className="absolute right-2 top-1 rounded-full bg-red-500 px-1 text-[9px] text-white">{badge}</span>}
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === 'steps' && <StepList issues={issues} />}
              {tab === 'data' && <DataPanel />}
              {tab === 'theme' && <ThemePanel />}
              {tab === 'ai' && <AiPanel issues={issues} />}
            </div>
          </aside>
        )}

        <main className="min-w-0 flex-1 overflow-auto">
          <Canvas />
        </main>

        {mode === 'edit' && (
          <aside className="w-[330px] flex-none overflow-y-auto border-l border-slate-200 bg-white">
            <Inspector />
          </aside>
        )}
      </div>

      {exporting && <ExportDialog onClose={() => setExporting(false)} />}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 whitespace-pre-line rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl ${
            toast.error ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function AiPanel({ issues }: { issues: ReturnType<typeof validateMockup> }) {
  const m = useMockup((s) => s.mockup);
  const { updateMeta, setActiveStep, select } = useMockup.getState();
  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <label className="ed-label">Opis makiety</label>
        <textarea className="ed-input" rows={2} value={m.description ?? ''} onChange={(e) => updateMeta({ description: e.target.value })} />
      </div>
      <div>
        <label className="ed-label">Kontekst dla AI (globalny)</label>
        <textarea
          className="ed-input font-mono !text-xs"
          rows={7}
          placeholder="Stack, biblioteka UI, konwencje, czego unikać…"
          value={m.aiContext ?? ''}
          onChange={(e) => updateMeta({ aiContext: e.target.value })}
        />
      </div>
      <div>
        <div className="ed-label">Problemy ({issues.length})</div>
        {issues.length === 0 && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">Makieta spójna — gotowa do eksportu.</div>}
        <div className="flex flex-col gap-1.5">
          {issues.map((i, k) => (
            <button
              key={k}
              onClick={() => {
                if (i.stepId) setActiveStep(i.stepId);
                if (i.elementId) select({ type: 'element', elementId: i.elementId });
              }}
              className="flex gap-2 rounded-lg bg-red-50 px-2.5 py-2 text-left text-xs text-red-700 hover:bg-red-100"
            >
              <AlertCircle size={13} className="mt-0.5 flex-none" />
              <span>
                {i.stepId && <b>{i.stepId}: </b>}
                {i.message}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
