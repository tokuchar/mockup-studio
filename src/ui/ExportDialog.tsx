import { useMemo, useState } from 'react';
import { Check, Copy, Download, Image, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useMockup } from '../store/useMockup';
import { toYaml } from '../io/yaml';
import { toPrompt } from '../export/toPrompt';
import { download } from '../io/fsAccess';

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const mockup = useMockup((s) => s.mockup);
  const [tab, setTab] = useState<'prompt' | 'yaml'>('prompt');
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => (tab === 'yaml' ? toYaml(mockup) : toPrompt(mockup)), [tab, mockup]);
  const fileName = tab === 'yaml' ? `${mockup.name}.mockup.yaml` : `${mockup.name}.prompt.md`;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const png = async () => {
    const node = document.getElementById('ms-canvas');
    if (!node) return;
    const prevMode = useMockup.getState().mode;
    useMockup.getState().setMode('preview');
    await new Promise((r) => setTimeout(r, 80));
    const url = await toPng(document.getElementById('ms-canvas')!, { pixelRatio: 2 });
    if (prevMode === 'edit') useMockup.getState().setMode('edit');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mockup.name}-${useMockup.getState().activeStepId}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-[85vh] w-[960px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {(
              [
                ['prompt', 'Prompt dla AI (Markdown)'],
                ['yaml', 'Makieta (YAML)'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold ${tab === k ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="hidden text-xs text-slate-400 lg:inline">
            {text.length.toLocaleString('pl')} znaków · ~{Math.round(text.length / 3.5).toLocaleString('pl')} tokenów
          </span>
          <div className="ml-auto flex gap-1.5">
            <button className="ed-btn whitespace-nowrap" onClick={png} title="Zrzut aktywnego kroku do dołączenia do promptu">
              <Image size={15} /> PNG kroku
            </button>
            <button className="ed-btn whitespace-nowrap" onClick={() => download(fileName, text)}>
              <Download size={15} /> {fileName}
            </button>
            <button className="ed-btn-primary whitespace-nowrap" onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Skopiowano' : 'Kopiuj'}
            </button>
            <button className="ed-icon-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words bg-slate-50 p-5 font-mono text-[12.5px] leading-relaxed text-slate-700">{text}</pre>
      </div>
    </div>
  );
}
