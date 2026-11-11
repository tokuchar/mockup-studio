import YAML from 'yaml';
import { CONTROL_TYPES, Mockup } from '../model/schema';
import { LEGACY_CONTROLS } from '../model/controls';

/** Stała kolejność kluczy: stabilny diff w Git i czytelność (kind/label na początku). */
const KEY_ORDER = [
  'version', 'name', 'entity', 'id', 'kind', 'title', 'label', 'description', 'purpose', 'optional', 'when', 'skipTo', 'aiContext', 'theme', 'data', 'steps',
  'preset', 'colors', 'radius', 'density', 'font', 'shadow', 'controlRefs', 'customCss',
  'type', 'bind', 'control', 'text', 'level', 'variant',
  'span', 'required', 'options', 'dictionary', 'placeholder', 'hint', 'source', 'columns', 'rowActions', 'height', 'icon',
  'emphasis', 'align', 'color', 'event', 'do', 'to', 'target', 'then', 'on',
  'fields', 'items', 'sections', 'rows', 'transitions', 'style', 'aiHint',
];
const rank = (k: string) => {
  const i = KEY_ORDER.indexOf(k);
  return i < 0 ? KEY_ORDER.length : i;
};

/** Usuwa puste wartości, żeby YAML był krótki i czytelny dla LLM. */
export function clean<T>(v: T, parentKey = ''): T {
  if (Array.isArray(v)) return v.map((x) => clean(x, parentKey)) as T;
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    const entries = Object.entries(v);
    if (parentKey === 'controlRefs')
      entries.sort(([a], [b]) => CONTROL_TYPES.indexOf(a as never) - CONTROL_TYPES.indexOf(b as never));
    else if (parentKey !== 'colors') entries.sort(([a], [b]) => rank(a) - rank(b));
    for (const [k, val] of entries) {
      if (val === undefined || val === null || val === '') continue;
      // puste tablice usuwamy, poza wierszami sekcji (pusty wiersz ma znaczenie)
      if (Array.isArray(val) && val.length === 0 && k !== 'rows' && k !== 'steps' && k !== 'data' && k !== 'sections' && k !== 'fields' && k !== 'items')
        continue;
      out[k] = clean(val, k);
    }
    return out as T;
  }
  return v;
}

const HEADER =
  '# Mockup Studio — makieta wizarda. Schemat: mockup.schema.json\n' +
  '# Siatka 12 kolumn: każdy element ma `span` 1–12; `rows` to lista wierszy, wiersz to lista elementów.\n';

export function toYaml(m: Mockup): string {
  const doc = new YAML.Document(clean(m));
  YAML.visit(doc, {
    Pair(_, pair) {
      const key = (pair.key as YAML.Scalar | null)?.value;
      // kolory i proste listy opcji/kolumn w jednej linii
      if ((key === 'colors' || key === 'options' || key === 'columns' || key === 'rowActions') && YAML.isCollection(pair.value)) {
        pair.value.flow = true;
      }
    },
  });
  return HEADER + doc.toString({ lineWidth: 0 });
}

export class MockupParseError extends Error {}

/** Podnosi stare makiety (kontrolki sprzed PrimeNG) do bieżącego formatu. Nie rzuca wyjątków. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrate(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const map = (c: unknown) => (typeof c === 'string' && LEGACY_CONTROLS[c]) || c;
  for (const step of raw.steps ?? [])
    for (const sec of step.sections ?? [])
      for (const row of sec.rows ?? [])
        for (const el of row ?? []) {
          if (el?.kind !== 'field' || !el.control) continue;
          el.control = map(el.control);
        }
  const refs = raw.theme?.controlRefs;
  if (refs && typeof refs === 'object') {
    for (const k of Object.keys(refs)) {
      const n = map(k) as string;
      if (n !== k) {
        refs[n] ??= refs[k];
        delete refs[k];
      }
    }
  }
  return raw;
}

export function fromYaml(text: string): Mockup {
  let raw: unknown;
  try {
    raw = YAML.parse(text);
  } catch (e) {
    throw new MockupParseError(`Błędny YAML: ${(e as Error).message}`);
  }
  const res = Mockup.safeParse(migrate(raw));
  if (!res.success) {
    const msg = res.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new MockupParseError(`Niepoprawna makieta:\n${msg}`);
  }
  return res.data;
}
