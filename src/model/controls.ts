import type { ControlType, SemanticType } from './schema';

export const PRIMENG_DOCS = 'https://v17.primeng.org';

export interface ControlInfo {
  id: ControlType;
  label: string;
  group: 'Tekst i liczby' | 'Wybór' | 'Przełączniki' | 'Data i inne' | 'Złożone (z PrimeNG)';
  /** Selektor komponentu PrimeNG 17. */
  tag: string;
  /** Moduł do importu. */
  module: string;
  /** Dokumentacja komponentu (domyślny wzorzec dla AI). */
  doc: string;
  /** Lista opcji: wymagana (dropdown) albo opcjonalna (checkbox: pusta = pojedynczy). */
  options?: 'required' | 'optional';
}

const c = (
  id: ControlType,
  label: string,
  group: ControlInfo['group'],
  tag: string,
  module: string,
  page: string,
  options?: ControlInfo['options'],
): ControlInfo => ({ id, label, group, tag, module, doc: `${PRIMENG_DOCS}/${page}`, options });

/** Katalog kontrolek = komponenty formularzy PrimeNG 17 (https://v17.primeng.org). */
export const CONTROLS: ControlInfo[] = [
  c('inputText', 'InputText — pole tekstowe', 'Tekst i liczby', 'input pInputText', 'InputTextModule', 'inputtext'),
  c('inputTextarea', 'InputTextarea — pole wieloliniowe', 'Tekst i liczby', 'textarea pInputTextarea', 'InputTextareaModule', 'inputtextarea'),
  c('inputNumber', 'InputNumber — liczba / kwota', 'Tekst i liczby', 'p-inputNumber', 'InputNumberModule', 'inputnumber'),
  c('inputMask', 'InputMask — maska (NIP, PESEL, kod…)', 'Tekst i liczby', 'p-inputMask', 'InputMaskModule', 'inputmask'),
  c('inputOtp', 'InputOtp — kod jednorazowy', 'Tekst i liczby', 'p-inputOtp', 'InputOtpModule', 'inputotp'),
  c('password', 'Password — hasło', 'Tekst i liczby', 'p-password', 'PasswordModule', 'password'),
  c('chips', 'Chips — tagi wpisywane', 'Tekst i liczby', 'p-chips', 'ChipsModule', 'chips'),
  c('editor', 'Editor — tekst sformatowany', 'Tekst i liczby', 'p-editor', 'EditorModule', 'editor'),

  c('dropdown', 'Dropdown — lista rozwijana', 'Wybór', 'p-dropdown', 'DropdownModule', 'dropdown', 'required'),
  c('autoComplete', 'AutoComplete — z podpowiedziami', 'Wybór', 'p-autoComplete', 'AutoCompleteModule', 'autocomplete', 'required'),
  c('multiSelect', 'MultiSelect — wielokrotny wybór', 'Wybór', 'p-multiSelect', 'MultiSelectModule', 'multiselect', 'required'),
  c('listbox', 'Listbox — lista wyboru', 'Wybór', 'p-listbox', 'ListboxModule', 'listbox', 'required'),
  c('selectButton', 'SelectButton — przyciski wyboru', 'Wybór', 'p-selectButton', 'SelectButtonModule', 'selectbutton', 'required'),
  c('radioButton', 'RadioButton — radio', 'Wybór', 'p-radioButton', 'RadioButtonModule', 'radiobutton', 'required'),
  c('checkbox', 'Checkbox (pojedynczy lub grupa)', 'Wybór', 'p-checkbox', 'CheckboxModule', 'checkbox', 'optional'),
  c('triStateCheckbox', 'TriStateCheckbox — tak/nie/brak', 'Wybór', 'p-triStateCheckbox', 'TriStateCheckboxModule', 'tristatecheckbox'),
  c('treeSelect', 'TreeSelect — wybór z drzewa', 'Wybór', 'p-treeSelect', 'TreeSelectModule', 'treeselect', 'required'),
  c('cascadeSelect', 'CascadeSelect — wybór kaskadowy', 'Wybór', 'p-cascadeSelect', 'CascadeSelectModule', 'cascadeselect', 'required'),

  c('inputSwitch', 'InputSwitch — przełącznik', 'Przełączniki', 'p-inputSwitch', 'InputSwitchModule', 'inputswitch'),
  c('toggleButton', 'ToggleButton — przycisk wł./wył.', 'Przełączniki', 'p-toggleButton', 'ToggleButtonModule', 'togglebutton'),

  c('calendar', 'Calendar — data / zakres dat', 'Data i inne', 'p-calendar', 'CalendarModule', 'calendar'),
  c('slider', 'Slider — suwak', 'Data i inne', 'p-slider', 'SliderModule', 'slider'),
  c('knob', 'Knob — pokrętło', 'Data i inne', 'p-knob', 'KnobModule', 'knob'),
  c('rating', 'Rating — ocena gwiazdkami', 'Data i inne', 'p-rating', 'RatingModule', 'rating'),
  c('colorPicker', 'ColorPicker — kolor', 'Data i inne', 'p-colorPicker', 'ColorPickerModule', 'colorpicker'),
  c('fileUpload', 'FileUpload — załącznik', 'Data i inne', 'p-fileUpload', 'FileUploadModule', 'fileupload'),

  c('address', 'Adres (pInputText ×5 w siatce)', 'Złożone (z PrimeNG)', 'input pInputText ×5', 'InputTextModule', 'inputtext'),
  c('readonly', 'Tylko odczyt (tekst + p-tag źródła)', 'Złożone (z PrimeNG)', 'span + p-tag', 'TagModule', 'tag'),
];

export const CONTROL_GROUPS = [...new Set(CONTROLS.map((x) => x.group))];

export const controlInfo = (id: ControlType): ControlInfo => CONTROLS.find((x) => x.id === id) ?? CONTROLS[0];

/** Domyślna kontrolka PrimeNG dla typu semantycznego danych. */
export const DEFAULT_CONTROL: Record<SemanticType, ControlType> = {
  text: 'inputText',
  'text-long': 'inputTextarea',
  number: 'inputNumber',
  amount: 'inputNumber',
  date: 'calendar',
  'date-range': 'calendar',
  'yes-no': 'selectButton',
  flag: 'checkbox',
  consent: 'checkbox',
  'enum-small': 'radioButton',
  enum: 'dropdown',
  dict: 'dropdown',
  'multi-small': 'checkbox',
  multi: 'multiSelect',
  nip: 'inputMask',
  pesel: 'inputMask',
  regon: 'inputMask',
  iban: 'inputMask',
  postcode: 'inputMask',
  email: 'inputText',
  phone: 'inputMask',
  address: 'address',
  file: 'fileUpload',
  readonly: 'readonly',
};

/** Maski p-inputMask dla identyfikatorów. */
export const MASKS: Partial<Record<SemanticType, string>> = {
  nip: '999-999-99-99',
  pesel: '99999999999',
  regon: '999999999',
  iban: 'PL99 9999 9999 9999 9999 9999 9999',
  postcode: '99-999',
  phone: '+48 999 999 999',
};

/** Typy, dla których kontrolka z opcjami ma sensowne opcje domyślne (bez listy w danych). */
export const IMPLICIT_OPTIONS: Partial<Record<SemanticType, string[]>> = {
  'yes-no': ['Tak', 'Nie'],
};

/** Stare id kontrolek (przed PrimeNG) → nowe. */
export const LEGACY_CONTROLS: Record<string, ControlType> = {
  input: 'inputText',
  textarea: 'inputTextarea',
  number: 'inputNumber',
  amount: 'inputNumber',
  'id-field': 'inputMask',
  select: 'dropdown',
  autocomplete: 'autoComplete',
  radio: 'radioButton',
  'radio-cards': 'radioButton',
  'yes-no': 'selectButton',
  'checkbox-group': 'checkbox',
  toggle: 'inputSwitch',
  consent: 'checkbox',
  date: 'calendar',
  'date-range': 'calendar',
  file: 'fileUpload',
};

export const SEMANTIC_LABELS: Record<SemanticType, string> = {
  text: 'Tekst krótki',
  'text-long': 'Tekst długi',
  number: 'Liczba',
  amount: 'Kwota',
  date: 'Data',
  'date-range': 'Zakres dat',
  'yes-no': 'Tak/Nie (wymagane)',
  flag: 'Flaga opcjonalna',
  consent: 'Zgoda',
  'enum-small': 'Wybór 2–4 opcji',
  enum: 'Wybór 5–15 opcji',
  dict: 'Słownik z backendu',
  'multi-small': 'Wielokrotny ≤6',
  multi: 'Wielokrotny >6',
  nip: 'NIP',
  pesel: 'PESEL',
  regon: 'REGON',
  iban: 'IBAN',
  postcode: 'Kod pocztowy',
  email: 'E-mail',
  phone: 'Telefon',
  address: 'Adres',
  file: 'Plik',
  readonly: 'Tylko odczyt (prefill)',
};
