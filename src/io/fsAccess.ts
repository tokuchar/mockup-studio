/* File System Access API (Chrome/Edge) z fallbackiem na pobieranie / <input type=file>. */

type DirHandle = FileSystemDirectoryHandle & {
  values(): AsyncIterable<FileSystemHandle>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<DirHandle>;
  }
}

export const fsSupported = () => typeof window !== 'undefined' && !!window.showDirectoryPicker;

let dir: DirHandle | null = null;

export const currentDir = () => dir;

export async function pickFolder(): Promise<string[]> {
  if (!window.showDirectoryPicker) throw new Error('Przeglądarka nie obsługuje wyboru folderu (użyj Chrome/Edge).');
  dir = await window.showDirectoryPicker({ mode: 'readwrite' });
  return listMockups();
}

export async function listMockups(): Promise<string[]> {
  if (!dir) return [];
  const names: string[] = [];
  for await (const h of dir.values()) {
    if (h.kind === 'file' && h.name.endsWith('.mockup.yaml')) names.push(h.name);
  }
  return names.sort();
}

export async function readFromFolder(name: string): Promise<string> {
  if (!dir) throw new Error('Nie wybrano folderu');
  const fh = await dir.getFileHandle(name);
  return (await fh.getFile()).text();
}

export async function writeToFolder(name: string, content: string): Promise<void> {
  if (!dir) throw new Error('Nie wybrano folderu');
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(content);
  await w.close();
}

export function download(name: string, content: string | Blob, type = 'text/plain') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function pickFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return reject(new Error('Nie wybrano pliku'));
      resolve(await f.text());
    };
    input.click();
  });
}
