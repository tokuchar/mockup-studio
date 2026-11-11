import type { ColumnElement, DataField, Element, ElementKind, LeafElement, Mockup, Section, Step } from './schema';
import { THEME_PRESETS } from './themes';

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`;

export function nextStepId(m: Mockup): string {
  let n = m.steps.length + 1;
  while (m.steps.some((s) => s.id === `s${n}`)) n++;
  return `s${n}`;
}

export function newSection(title = 'Nowa sekcja'): Section {
  return { id: uid('sec'), title, rows: [[]] };
}

/** Nowy krok ma domyślnie „Wstecz” po lewej (gdy jest poprzedni krok) i „Dalej” po prawej. */
export function newStep(id: string, title: string, prevId?: string): Step {
  const transitions: Step['transitions'] = [];
  if (prevId) transitions.push({ label: 'Wstecz', to: prevId, variant: 'outline', align: 'left' });
  transitions.push({ label: 'Dalej', variant: 'primary', align: 'right' });
  return { id, title, purpose: '', sections: [newSection('Sekcja 1')], transitions };
}

export function newElement(kind: ElementKind, span: number): LeafElement {
  const id = uid('el');
  switch (kind) {
    case 'field':
      return { id, kind, span, label: 'Nowe pole' };
    case 'text':
      return { id, kind, span, text: 'Nagłówek', level: 'h3' };
    case 'info':
      return { id, kind, span, text: 'Informacja dla użytkownika', variant: 'info' };
    case 'button':
      return { id, kind, span, label: 'Przycisk', variant: 'secondary' };
    case 'table':
      return { id, kind, span, title: 'Lista', columns: [] };
    case 'placeholder':
      return { id, kind, span, text: 'Opisz, co ma tu być (np. wykres, mapa, podsumowanie)', height: 'md' };
  }
}

export const ELEMENT_KINDS: { kind: ElementKind; label: string; desc: string }[] = [
  { kind: 'field', label: 'Pole formularza', desc: 'Dane do wpisania / wybrania' },
  { kind: 'text', label: 'Tekst / nagłówek', desc: 'Tytuł, opis, objaśnienie' },
  { kind: 'info', label: 'Komunikat', desc: 'Info, sukces, ostrzeżenie, błąd' },
  { kind: 'button', label: 'Przycisk', desc: 'Akcja w obrębie kroku' },
  { kind: 'table', label: 'Tabela / lista', desc: 'Wiersze z kolumnami z danych' },
  { kind: 'placeholder', label: 'Placeholder dla AI', desc: 'Opis czegoś, co AI ma zaprojektować' },
];

export function newColumn(span: number): ColumnElement {
  return { id: uid('col'), kind: 'column', span, items: [] };
}

/** Rozkłada 12 kolumn siatki na n części (np. 5 → 3,3,2,2,2). */
export function evenSpans(n: number): number[] {
  const base = Math.floor(12 / n);
  const extra = 12 - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Wszystkie elementy sekcji, także te w kolumnach (bez samych kolumn). */
export function sectionLeaves(sec: Section): LeafElement[] {
  return sec.rows.flat().flatMap((e) => (e.kind === 'column' ? e.items : [e]));
}

export function rowUsed(row: Element[]): number {
  return row.reduce((a, e) => a + e.span, 0);
}

/** Pole danych wskazane przez `bind` (entity.field). */
export function resolveBind(m: Mockup, bind?: string): DataField | undefined {
  if (!bind) return undefined;
  const [entity, field] = bind.split('.');
  return m.data.find((e) => e.entity === entity)?.fields.find((f) => f.id === field);
}

export function emptyMockup(): Mockup {
  return {
    version: 1,
    name: 'nowa-makieta',
    description: '',
    aiContext:
      'Angular 17, standalone components, Reactive Forms, PrimeNG 17 (motyw Lara, https://v17.primeng.org).',
    theme: structuredClone(THEME_PRESETS.modern),
    data: [],
    steps: [newStep('s1', 'Krok 1')],
  };
}

export function exampleMockup(): Mockup {
  return {
    version: 1,
    name: 'wniosek-kredytowy',
    description: 'Wizard wniosku kredytowego dla klienta firmowego',
    aiContext:
      'Angular 17, standalone components, Reactive Forms, PrimeNG 17 (motyw Lara, https://v17.primeng.org), PrimeFlex do siatki.\nJedna kolumna na mobile, siatka 12 kolumn od 768px.',
    theme: structuredClone(THEME_PRESETS.modern),
    data: [
      {
        entity: 'company',
        label: 'Firma',
        fields: [
          { id: 'nip', label: 'NIP', type: 'nip', required: true },
          { id: 'name', label: 'Nazwa firmy', type: 'readonly', source: 'GUS po NIP' },
          { id: 'legalForm', label: 'Forma prawna', type: 'enum-small', options: ['Sp. z o.o.', 'S.A.', 'JDG'] },
          { id: 'address', label: 'Adres siedziby', type: 'address', source: 'GUS po NIP' },
        ],
      },
      {
        entity: 'loan',
        label: 'Kredyt',
        fields: [
          { id: 'amount', label: 'Kwota kredytu', type: 'amount', required: true },
          { id: 'period', label: 'Okres (miesiące)', type: 'number', required: true },
          { id: 'purpose', label: 'Cel kredytu', type: 'dict', dictionary: 'CEL_KREDYTU' },
          { id: 'hasCollateral', label: 'Czy jest zabezpieczenie?', type: 'yes-no', required: true },
        ],
      },
    ],
    steps: [
      {
        id: 's1',
        title: 'Dane firmy',
        purpose: 'Klient podaje NIP, system pobiera dane z GUS.',
        aiHint: 'Dane z GUS pokaż jako readonly z możliwością korekty adresu.',
        sections: [
          {
            id: 'sec-firma',
            title: 'Firma',
            description: 'Podaj NIP, resztę uzupełnimy automatycznie.',
            rows: [
              [
                {
                  id: 'el-nip',
                  kind: 'field',
                  bind: 'company.nip',
                  span: 4,
                  hint: '10 cyfr, bez kresek',
                  aiHint: 'Walidacja sumy kontrolnej na blur',
                  on: [
                    {
                      event: 'blur',
                      do: 'call',
                      target: 'GUS: pobierz dane firmy',
                      then: 'wypełnij company.name i company.address',
                    },
                  ],
                },
                { id: 'el-name', kind: 'field', bind: 'company.name', span: 8 },
              ],
              [{ id: 'el-form', kind: 'field', bind: 'company.legalForm', span: 12 }],
              [
                {
                  id: 'el-info',
                  kind: 'info',
                  variant: 'info',
                  text: 'Dane pobieramy automatycznie z rejestru GUS.',
                  span: 12,
                },
              ],
            ],
          },
        ],
        transitions: [
          { label: 'Zapisz szkic', do: 'zapisz draft', variant: 'ghost' },
          { label: 'Dalej', to: 's2', when: 'formularz poprawny', variant: 'primary' },
        ],
      },
      {
        id: 's2',
        title: 'Parametry kredytu',
        purpose: 'Klient określa kwotę, okres i cel kredytu.',
        sections: [
          {
            id: 'sec-kredyt',
            title: 'Kredyt',
            rows: [
              [
                { id: 'el-amount', kind: 'field', bind: 'loan.amount', span: 6 },
                { id: 'el-period', kind: 'field', bind: 'loan.period', control: 'slider', span: 6 },
              ],
              [{ id: 'el-purpose', kind: 'field', bind: 'loan.purpose', span: 12 }],
              [{ id: 'el-coll', kind: 'field', bind: 'loan.hasCollateral', span: 12 }],
            ],
          },
        ],
        transitions: [
          { label: 'Wstecz', to: 's1', variant: 'outline' },
          { label: 'Wyślij wniosek', do: 'submit → ekran potwierdzenia', when: 'formularz poprawny', variant: 'primary' },
        ],
      },
    ],
  };
}
