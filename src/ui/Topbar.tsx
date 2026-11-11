import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { Eye, FilePlus2, FolderOpen, Pencil, Redo2, Save, Sparkles, Undo2, Upload } from 'lucide-react';
import { redo, undo, useMockup } from '../store/useMockup';
import { fromYaml, toYaml } from '../io/yaml';
import { toPrompt } from '../export/toPrompt';
import { currentDir, download, fsSupported, listMockups, pickFile, pickFolder, readFromFolder, writeToFolder } from '../io/fsAccess';

export function Topbar({ onExport, notify }: { onExport: () => void; notify: (msg: string, error?: boolean) => void }) {
  const name = useMockup((s) => s.mockup.name);
  const mode = useMockup((s) => s.mode);
  const { updateMeta, setMode, setMockup, newMockup } = useMockup.getState();
  const canUndo = useStore(useMockup.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useMockup.temporal, (s) => s.futureStates.length > 0);
  const [files, setFiles] = useState<string[] | null>(null);

  const load = (text: string) => {
    try {
      setMockup(fromYaml(text));
      useMockup.temporal.getState().clear();
      notify('Wczytano makietę');
    } catch (e) {
      notify((e as Error).message, true);
    }
  };

  const save = async () => {
    const m = useMockup.getState().mockup;
    try {
      if (currentDir()) {
        await writeToFolder(`${m.name}.mockup.yaml`, toYaml(m));
        await writeToFolder(`${m.name}.prompt.md`, toPrompt(m));
        setFiles(await listMockups());
        notify(`Zapisano ${m.name}.mockup.yaml + ${m.name}.prompt.md`);
      } else {
        download(`${m.name}.mockup.yaml`, toYaml(m));
        notify('Pobrano plik YAML (wybierz folder, aby zapisywać bezpośrednio)');
      }
    } catch (e) {
      notify((e as Error).message, true);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName);
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if (mod && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) {
        const sel = useMockup.getState().selection;
        if (sel.type === 'element') useMockup.getState().removeElement(sel.elementId);
      } else if (e.key === 'Escape' && !typing) {
        useMockup.getState().select({ type: 'none' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <header className="flex h-14 flex-none items-center gap-2 border-b border-slate-200 bg-white px-3">
      <div className="flex items-center gap-2 pr-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
          <Sparkles size={16} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-bold text-slate-800">Mockup Studio</div>
          <input
            value={name}
            onChange={(e) => updateMeta({ name: e.target.value.replace(/[^\w-]/g, '-') || 'makieta' })}
            className="w-44 rounded bg-transparent font-mono text-[11px] text-slate-500 outline-none hover:bg-slate-50 focus:bg-slate-50"
            title="Nazwa pliku makiety"
          />
        </div>
      </div>
      <div className="h-6 w-px bg-slate-200" />
      <button className="ed-btn" onClick={() => confirm('Nowa pusta makieta? Niezapisane zmiany przepadną.') && newMockup()}>
        <FilePlus2 size={15} /> Nowa
      </button>
      {fsSupported() && (
        <div className="relative">
          <button
            className="ed-btn"
            onClick={async () => {
              try {
                setFiles(await pickFolder());
              } catch (e) {
                if ((e as Error).name !== 'AbortError') notify((e as Error).message, true);
              }
            }}
          >
            <FolderOpen size={15} /> Folder
          </button>
        </div>
      )}
      {files && (
        <select
          className="ed-input !w-48 !py-1"
          value=""
          onChange={async (e) => e.target.value && load(await readFromFolder(e.target.value))}
        >
          <option value="">{files.length ? `Otwórz (${files.length})…` : 'brak *.mockup.yaml'}</option>
          {files.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      )}
      <button
        className="ed-btn"
        onClick={async () => {
          try {
            load(await pickFile());
          } catch {
            /* anulowano */
          }
        }}
      >
        <Upload size={15} /> Import
      </button>
      <button className="ed-btn" onClick={save} title="Ctrl/Cmd+S">
        <Save size={15} /> Zapisz
      </button>
      <div className="h-6 w-px bg-slate-200" />
      <button className="ed-icon-btn" disabled={!canUndo} onClick={undo} title="Cofnij (Ctrl/Cmd+Z)">
        <Undo2 size={16} />
      </button>
      <button className="ed-icon-btn" disabled={!canRedo} onClick={redo} title="Ponów (Ctrl/Cmd+Shift+Z)">
        <Redo2 size={16} />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          <button
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${mode === 'edit' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
          >
            <Pencil size={14} /> Edycja
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${mode === 'preview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
          >
            <Eye size={14} /> Podgląd
          </button>
        </div>
        <button className="ed-btn-primary" onClick={onExport}>
          <Sparkles size={15} /> Eksport dla AI
        </button>
      </div>
    </header>
  );
}

