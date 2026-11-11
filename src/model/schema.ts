import { z } from 'zod';

/** Typy semantyczne pól — zgodne z katalogiem kontrolek (wizard-refactor-plan, Faza 4.0). */
export const SEMANTIC_TYPES = [
  'text',
  'text-long',
  'number',
  'amount',
  'date',
  'date-range',
  'yes-no',
  'flag',
  'consent',
  'enum-small',
  'enum',
  'dict',
  'multi-small',
  'multi',
  'nip',
  'pesel',
  'regon',
  'iban',
  'postcode',
  'email',
  'phone',
  'address',
  'file',
  'readonly',
] as const;
export const SemanticType = z.enum(SEMANTIC_TYPES);
export type SemanticType = z.infer<typeof SemanticType>;

/** Kontrolki = komponenty formularzy PrimeNG 17 (+ dwa złożone z nich). */
export const CONTROL_TYPES = [
  'inputText',
  'inputTextarea',
  'inputNumber',
  'inputMask',
  'inputOtp',
  'password',
  'chips',
  'editor',
  'dropdown',
  'autoComplete',
  'multiSelect',
  'listbox',
  'selectButton',
  'radioButton',
  'checkbox',
  'triStateCheckbox',
  'treeSelect',
  'cascadeSelect',
  'inputSwitch',
  'toggleButton',
  'calendar',
  'slider',
  'knob',
  'rating',
  'colorPicker',
  'fileUpload',
  'address',
  'readonly',
] as const;
export const ControlType = z.enum(CONTROL_TYPES);
export type ControlType = z.infer<typeof ControlType>;

export const ColorToken = z.enum([
  'primary',
  'accent',
  'success',
  'warning',
  'error',
  'info',
  'text',
  'muted',
]);
export type ColorToken = z.infer<typeof ColorToken>;

export const DataField = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: SemanticType,
  required: z.boolean().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  /** Kod słownika z backendu (np. CEL_KREDYTU) — źródło opcji zamiast stałej listy. */
  dictionary: z.string().optional(),
});
export type DataField = z.infer<typeof DataField>;

export const DataEntity = z.object({
  entity: z.string().min(1),
  label: z.string().optional(),
  fields: z.array(DataField),
});
export type DataEntity = z.infer<typeof DataEntity>;

export const ACTION_EVENTS = ['change', 'blur', 'click', 'load', 'submit'] as const;
export const ACTION_KINDS = ['call', 'navigate', 'show', 'hide', 'set', 'validate', 'custom'] as const;

export const Action = z.object({
  event: z.enum(ACTION_EVENTS),
  do: z.enum(ACTION_KINDS),
  target: z.string().optional(),
  when: z.string().optional(),
  then: z.string().optional(),
});
export type Action = z.infer<typeof Action>;

/** Własny wygląd elementu / kolumny / sekcji (nadpisuje motyw). */
export const CustomStyle = z.object({
  background: z.string().optional(),
  color: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().int().min(0).max(8).optional(),
  radius: z.number().int().min(0).max(40).optional(),
  padding: z.number().int().min(0).max(64).optional(),
  fontSize: z.number().int().min(8).max(48).optional(),
  fontWeight: z.enum(['normal', 'medium', 'bold']).optional(),
  shadow: z.enum(['none', 'soft', 'strong']).optional(),
  /** Dowolne deklaracje CSS, np. `letter-spacing: 1px; --c-primary: #e11d48`. */
  css: z.string().optional(),
  /** Opis wyglądu słowami — dla AI. */
  note: z.string().optional(),
});
export type CustomStyle = z.infer<typeof CustomStyle>;

const base = {
  id: z.string().min(1),
  span: z.number().int().min(1).max(12),
  aiHint: z.string().optional(),
  style: CustomStyle.optional(),
  color: z.union([ColorToken, z.string().regex(/^#[0-9a-fA-F]{6}$/)]).optional(),
};

export const FieldElement = z.object({
  ...base,
  kind: z.literal('field'),
  bind: z.string().optional(),
  label: z.string().optional(),
  control: ControlType.optional(),
  options: z.array(z.string()).optional(),
  /** Kod słownika z backendu — nadpisuje słownik z danych. */
  dictionary: z.string().optional(),
  placeholder: z.string().optional(),
  hint: z.string().optional(),
  required: z.boolean().optional(),
  on: z.array(Action).optional(),
});

export const TextElement = z.object({
  ...base,
  kind: z.literal('text'),
  text: z.string(),
  level: z.enum(['h1', 'h2', 'h3', 'body', 'muted']).optional(),
});

export const InfoElement = z.object({
  ...base,
  kind: z.literal('info'),
  text: z.string(),
  variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
  title: z.string().optional(),
});

export const ButtonElement = z.object({
  ...base,
  kind: z.literal('button'),
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'outline', 'danger', 'ghost']).optional(),
  icon: z.string().optional(),
  on: z.array(Action).optional(),
});

export const TableElement = z.object({
  ...base,
  kind: z.literal('table'),
  title: z.string().optional(),
  entity: z.string().optional(),
  columns: z.array(z.string()).optional(),
  rowActions: z.array(z.string()).optional(),
});

export const PlaceholderElement = z.object({
  ...base,
  kind: z.literal('placeholder'),
  text: z.string(),
  height: z.enum(['sm', 'md', 'lg']).optional(),
});

/** Element „liściowy” — może stać w wierszu albo w kolumnie. */
export const LeafElement = z.discriminatedUnion('kind', [
  FieldElement,
  TextElement,
  InfoElement,
  ButtonElement,
  TableElement,
  PlaceholderElement,
]);
export type LeafElement = z.infer<typeof LeafElement>;
export type ElementKind = LeafElement['kind'];

/** Kolumna w wierszu: zajmuje `span` z 12 kolumn i układa elementy jeden pod drugim. */
export const ColumnElement = z.object({
  id: z.string().min(1),
  kind: z.literal('column'),
  span: z.number().int().min(1).max(12),
  title: z.string().optional(),
  aiHint: z.string().optional(),
  style: CustomStyle.optional(),
  items: z.array(LeafElement),
});
export type ColumnElement = z.infer<typeof ColumnElement>;

export const Element = z.discriminatedUnion('kind', [
  FieldElement,
  TextElement,
  InfoElement,
  ButtonElement,
  TableElement,
  PlaceholderElement,
  ColumnElement,
]);
export type Element = z.infer<typeof Element>;
export type FieldElement = z.infer<typeof FieldElement>;
export type ButtonElement = z.infer<typeof ButtonElement>;

export const Section = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  emphasis: z.enum(['card', 'highlight', 'plain']).optional(),
  aiHint: z.string().optional(),
  style: CustomStyle.optional(),
  rows: z.array(z.array(Element)),
});
export type Section = z.infer<typeof Section>;

export const Transition = z.object({
  label: z.string(),
  to: z.string().optional(),
  do: z.string().optional(),
  when: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'outline', 'danger', 'ghost']).optional(),
  /** Położenie przycisku w pasku nawigacji (domyślnie: primary po prawej, reszta po lewej). */
  align: z.enum(['left', 'right']).optional(),
});
export type Transition = z.infer<typeof Transition>;

export const transitionAlign = (t: Transition): 'left' | 'right' =>
  t.align ?? ((t.variant ?? 'primary') === 'primary' ? 'right' : 'left');

export const Step = z.object({
  id: z.string().min(1),
  title: z.string(),
  purpose: z.string().optional(),
  /** Krok opcjonalny — pokazywany tylko, gdy spełniony jest warunek `when`. */
  optional: z.boolean().optional(),
  /** Kiedy krok się uruchamia (opis warunku słowami lub wyrażeniem na danych). */
  when: z.string().optional(),
  /** Dokąd przejść, gdy warunek nie jest spełniony (domyślnie: następny krok). */
  skipTo: z.string().optional(),
  aiHint: z.string().optional(),
  sections: z.array(Section),
  transitions: z.array(Transition).optional(),
});
export type Step = z.infer<typeof Step>;

export const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const Theme = z.object({
  preset: z.string().optional(),
  colors: z.object({
    primary: Hex,
    accent: Hex,
    background: Hex,
    surface: Hex,
    text: Hex,
    muted: Hex,
    border: Hex,
    success: Hex,
    warning: Hex,
    error: Hex,
    info: Hex,
  }),
  radius: z.number().int().min(0).max(24),
  density: z.enum(['compact', 'comfortable']),
  font: z.string(),
  shadow: z.enum(['none', 'soft', 'strong']),
  /** Linki do wzorców kontrolek (design system, Storybook, Figma, dokumentacja) — kontekst dla AI. */
  controlRefs: z.record(ControlType, z.string()).optional(),
  /** Globalny własny CSS stosowany do całej makiety (np. nadpisanie .ms-input). */
  customCss: z.string().optional(),
});
export type Theme = z.infer<typeof Theme>;

export const Mockup = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  description: z.string().optional(),
  aiContext: z.string().optional(),
  theme: Theme,
  data: z.array(DataEntity),
  steps: z.array(Step),
});
export type Mockup = z.infer<typeof Mockup>;
