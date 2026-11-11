import { useState, type CSSProperties } from 'react';
import {
  AlertTriangle,
  Bold,
  Calendar,
  CheckCircle2,
  Eye,
  Info,
  Italic,
  List,
  Lock,
  Minus,
  Plus,
  Sparkles,
  Star,
  Underline,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import type { ControlType, Element, FieldElement, Mockup, SemanticType } from '../../model/schema';
import { controlInfo, DEFAULT_CONTROL, IMPLICIT_OPTIONS, MASKS } from '../../model/controls';
import { resolveBind } from '../../model/defaults';
import { resolveColor } from '../../model/themes';
import { styleToCss } from '../../model/style';
import { PAutoComplete, PDropdown, PMultiSelect, PTreeSelect } from './PrimeSelects';

/** Renderuje element makiety jako nowoczesny, działający komponent UI (z własnym wyglądem, jeśli ustawiony). */
export function ElementView({ el, mockup }: { el: Element; mockup: Mockup }) {
  const custom = styleToCss(mockup.theme, el.style);
  // tekst, komunikat i przycisk dostają styl bezpośrednio; pozostałe — ramkę wokół
  if (el.kind === 'text' || el.kind === 'info' || el.kind === 'button') return <ElementBody el={el} mockup={mockup} custom={custom} />;
  const inner = <ElementBody el={el} mockup={mockup} />;
  return custom ? <div style={custom}>{inner}</div> : inner;
}

function ElementBody({ el, mockup, custom }: { el: Element; mockup: Mockup; custom?: CSSProperties }) {
  if (el.kind === 'column')
    return (
      <div className="flex flex-col" style={{ gap: 'calc(var(--gap) - 4px)' }}>
        {el.title && <div className="ms-label">{el.title}</div>}
        {el.items.map((x) => (
          <ElementView key={x.id} el={x} mockup={mockup} />
        ))}
      </div>
    );
  const color = resolveColor(mockup.theme, el.color);
  switch (el.kind) {
    case 'field':
      return <FieldView el={el} mockup={mockup} />;
    case 'text': {
      const style: CSSProperties = { color, ...custom };
      if (el.level === 'h1') return <h1 style={style} className="text-[28px] font-bold leading-tight tracking-tight">{el.text}</h1>;
      if (el.level === 'h2') return <h2 style={style} className="text-[21px] font-bold tracking-tight">{el.text}</h2>;
      if (el.level === 'h3') return <h3 style={style} className="text-[16px] font-semibold">{el.text}</h3>;
      if (el.level === 'muted') return <p style={{ color: color ?? 'var(--c-muted)', ...custom }} className="text-[13px]">{el.text}</p>;
      return <p style={style} className="text-[14px] leading-relaxed">{el.text}</p>;
    }
    case 'info': {
      const v = el.variant ?? 'info';
      const Icon = v === 'success' ? CheckCircle2 : v === 'warning' ? AlertTriangle : v === 'error' ? XCircle : Info;
      return (
        <div className="ms-alert" style={{ ['--tone' as string]: color ?? `var(--c-${v})`, ...custom }}>
          <Icon size={18} />
          <div>
            {el.title && <div className="mb-0.5 font-semibold">{el.title}</div>}
            {el.text}
          </div>
        </div>
      );
    }
    case 'button':
      return (
        <button
          className={`ms-btn ${el.variant ?? 'secondary'} w-full`}
          style={{ ['--btn' as string]: color ?? 'var(--c-primary)', ...custom }}
        >
          {el.label}
        </button>
      );
    case 'table': {
      const entity = mockup.data.find((e) => e.entity === el.entity);
      const cols = el.columns?.length
        ? el.columns.map((c) => entity?.fields.find((f) => f.id === c)?.label ?? c)
        : entity?.fields.slice(0, 4).map((f) => f.label) ?? ['Kolumna 1', 'Kolumna 2', 'Kolumna 3'];
      return (
        <div>
          {el.title && <div className="ms-label">{el.title}</div>}
          <table className="ms-table" style={{ background: 'var(--c-surface)' }}>
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                {el.rowActions?.length ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {[70, 50, 85].map((w, r) => (
                <tr key={r}>
                  {cols.map((c, i) => (
                    <td key={c}>
                      <span className="ms-skel" style={{ width: `${((w + i * 17) % 60) + 30}%` }} />
                    </td>
                  ))}
                  {el.rowActions?.length ? (
                    <td style={{ textAlign: 'right', color: 'var(--c-primary)', fontWeight: 600, fontSize: 13 }}>
                      {el.rowActions.join(' · ')}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'placeholder': {
      const h = el.height === 'sm' ? 72 : el.height === 'lg' ? 220 : 130;
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 px-6 text-center"
          style={{
            minHeight: h,
            borderRadius: 'var(--radius)',
            border: '1.5px dashed color-mix(in srgb, var(--c-accent) 55%, var(--c-border))',
            background:
              'repeating-linear-gradient(135deg, color-mix(in srgb, var(--c-accent) 5%, var(--c-surface)) 0 10px, var(--c-surface) 10px 20px)',
            color: 'var(--c-muted)',
          }}
        >
          <Sparkles size={20} style={{ color: 'var(--c-accent)' }} />
          <div className="text-[13.5px] font-medium" style={{ color: 'var(--c-text)' }}>
            {el.text}
          </div>
          <div className="text-[11px] uppercase tracking-wider">do zaprojektowania przez AI</div>
        </div>
      );
    }
  }
}
function FieldView({ el, mockup }: { el: FieldElement; mockup: Mockup }) {
  const field = resolveBind(mockup, el.bind);
  const control: ControlType = el.control ?? (field ? DEFAULT_CONTROL[field.type] : 'inputText');
  const label = el.label ?? field?.label ?? 'Pole';
  const required = el.required ?? field?.required ?? false;
  const dictionary = el.options ? undefined : el.dictionary ?? field?.dictionary;
  const explicit =
    el.options ??
    (dictionary ? [`${dictionary} · pozycja 1`, `${dictionary} · pozycja 2`, `${dictionary} · pozycja 3`] : undefined) ??
    field?.options ??
    (field ? IMPLICIT_OPTIONS[field.type] : undefined);
  const needs = controlInfo(control).options === 'required';
  const options = explicit ?? (needs ? ['Opcja 1', 'Opcja 2', 'Opcja 3'] : []);
  const ph = el.placeholder ?? (dictionary ? `Wybierz ze słownika ${dictionary}…` : '');

  // pojedynczy checkbox / przełączniki mają etykietę obok kontrolki
  const inline = (control === 'checkbox' && options.length === 0) || control === 'inputSwitch' || control === 'triStateCheckbox';

  return (
    <div>
      {!inline && (
        <label className="ms-label">
          {label}
          {dictionary && (
            <span className="ms-badge" style={{ marginLeft: 8, fontFamily: 'ui-monospace, monospace' }}>
              📖 {dictionary}
            </span>
          )}
          {!required && control !== 'readonly' && <span className="ms-optional">(opcjonalne)</span>}
        </label>
      )}
      <Control control={control} label={label} options={options} placeholder={ph} type={field?.type} source={field?.source} />
      {el.hint && <div className="ms-hint">{el.hint}</div>}
    </div>
  );
}

function Control({
  control,
  label,
  options,
  placeholder,
  type,
  source,
}: {
  control: ControlType;
  label: string;
  options: string[];
  placeholder: string;
  type?: SemanticType;
  source?: string;
}) {
  const [val, setVal] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>(options.slice(0, 2));
  const [on, setOn] = useState(false);
  const [tri, setTri] = useState<boolean | null>(null);
  const [range, setRange] = useState(40);
  const [stars, setStars] = useState(3);
  const [num, setNum] = useState(1);

  switch (control) {
    case 'inputText':
      return <input className="ms-input" placeholder={placeholder || (type === 'email' ? 'jan@firma.pl' : '')} />;

    case 'inputTextarea':
      return <textarea className="ms-input" rows={3} placeholder={placeholder} style={{ resize: 'vertical' }} />;

    case 'inputNumber':
      if (type === 'amount')
        return (
          <div className="ms-input ms-input-wrap">
            <input placeholder={placeholder || '0,00'} style={{ textAlign: 'right' }} />
            <span className="ms-adorn">PLN</span>
          </div>
        );
      return (
        <div className="ms-input ms-input-wrap" style={{ paddingRight: 4 }}>
          <input value={num} onChange={(e) => setNum(+e.target.value || 0)} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <button type="button" className="ms-spin" onClick={() => setNum(num + 1)}>
              <Plus size={11} />
            </button>
            <button type="button" className="ms-spin" onClick={() => setNum(num - 1)}>
              <Minus size={11} />
            </button>
          </span>
        </div>
      );

    case 'inputMask': {
      const mask = (type && MASKS[type]) ?? '999-999';
      return (
        <div className="ms-input ms-input-wrap">
          {type && MASKS[type] && <span className="ms-badge">{type.toUpperCase()}</span>}
          <input placeholder={placeholder || mask.replace(/9/g, '_')} style={{ letterSpacing: '0.04em' }} />
        </div>
      );
    }

    case 'inputOtp':
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <input key={i} className="ms-input" maxLength={1} style={{ width: 44, textAlign: 'center', fontWeight: 600 }} />
          ))}
        </div>
      );

    case 'password':
      return (
        <div>
          <div className="ms-input ms-input-wrap">
            <input type="password" placeholder={placeholder} defaultValue="secret12" />
            <Eye size={16} className="ms-adorn" />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {['var(--c-error)', 'var(--c-warning)', 'var(--c-border)'].map((c, i) => (
              <span key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: c }} />
            ))}
          </div>
        </div>
      );

    case 'chips':
      return (
        <div className="ms-input ms-input-wrap" style={{ flexWrap: 'wrap', minHeight: 44 }}>
          {multi.map((o) => (
            <span key={o} className="ms-chip">
              {o}
              <X size={13} style={{ cursor: 'pointer' }} onClick={() => setMulti(multi.filter((x) => x !== o))} />
            </span>
          ))}
          <input placeholder={placeholder || 'Wpisz i Enter…'} style={{ minWidth: 80 }} />
        </div>
      );

    case 'editor':
      return (
        <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--c-surface)' }}>
          <div style={{ display: 'flex', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--c-border)', color: 'var(--c-muted)', background: 'color-mix(in srgb, var(--c-text) 3%, var(--c-surface))' }}>
            <Bold size={15} /> <Italic size={15} /> <Underline size={15} /> <List size={15} />
          </div>
          <div style={{ minHeight: 90, padding: 12, fontSize: 14, color: 'var(--c-muted)' }} contentEditable suppressContentEditableWarning>
            {placeholder || 'Treść…'}
          </div>
        </div>
      );

    case 'dropdown':
      return <PDropdown options={options} placeholder={placeholder} />;

    case 'autoComplete':
      return <PAutoComplete options={options} placeholder={placeholder} />;

    case 'multiSelect':
      return <PMultiSelect options={options} placeholder={placeholder} />;

    case 'listbox':
      return (
        <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', background: 'var(--c-surface)', padding: 4 }}>
          {options.map((o) => (
            <div
              key={o}
              onClick={() => setVal(o)}
              style={{
                padding: '8px 12px',
                borderRadius: 'calc(var(--radius) - 2px)',
                fontSize: 14,
                cursor: 'pointer',
                background: val === o ? 'color-mix(in srgb, var(--c-primary) 12%, var(--c-surface))' : undefined,
                color: val === o ? 'var(--c-primary)' : undefined,
                fontWeight: val === o ? 600 : 400,
              }}
            >
              {o}
            </div>
          ))}
        </div>
      );

    case 'selectButton':
      return (
        <div className="ms-selectbtn">
          {options.map((o) => (
            <button key={o} type="button" className={val === o ? 'on' : ''} onClick={() => setVal(o)}>
              {o}
            </button>
          ))}
        </div>
      );

    case 'radioButton':
      return (
        <div className="flex flex-wrap" style={{ columnGap: 24, rowGap: 6 }}>
          {options.map((o) => (
            <label key={o} className="ms-choice">
              <input type="radio" className="ms-radio" name={label} checked={val === o} onChange={() => setVal(o)} />
              {o}
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      if (options.length === 0)
        return (
          <label className="ms-choice">
            <input type="checkbox" className="ms-check" checked={on} onChange={() => setOn(!on)} />
            {label}
          </label>
        );
      return (
        <div className="flex flex-col gap-1">
          {options.map((o) => (
            <label key={o} className="ms-choice">
              <input
                type="checkbox"
                className="ms-check"
                checked={multi.includes(o)}
                onChange={() => setMulti(multi.includes(o) ? multi.filter((x) => x !== o) : [...multi, o])}
              />
              {o}
            </label>
          ))}
        </div>
      );

    case 'triStateCheckbox':
      return (
        <label className="ms-choice" onClick={() => setTri(tri === null ? true : tri ? false : null)}>
          <span className={`ms-check ms-tri ${tri === true ? 'yes' : tri === false ? 'no' : ''}`}>{tri === false && <X size={12} strokeWidth={3} color="#fff" />}</span>
          {label}
          <span className="ms-hint" style={{ margin: 0 }}>
            ({tri === null ? 'brak' : tri ? 'tak' : 'nie'})
          </span>
        </label>
      );

    case 'treeSelect':
    case 'cascadeSelect':
      return <PTreeSelect options={options} placeholder={placeholder} cascade={control === 'cascadeSelect'} />;

    case 'inputSwitch':
      return (
        <label className="ms-choice" style={{ gap: 12 }}>
          <button type="button" className={`ms-toggle ${on ? 'on' : ''}`} onClick={() => setOn(!on)} />
          <span>{label}</span>
        </label>
      );

    case 'toggleButton':
      return (
        <button type="button" className={`ms-togglebtn ${on ? 'on' : ''}`} onClick={() => setOn(!on)}>
          {on ? 'Tak' : 'Nie'}
        </button>
      );

    case 'calendar':
      return (
        <div className="ms-input ms-input-wrap">
          <input placeholder={placeholder || (type === 'date-range' ? 'dd.mm.rrrr – dd.mm.rrrr' : 'dd.mm.rrrr')} />
          <Calendar size={16} className="ms-adorn" />
        </div>
      );

    case 'slider':
      return (
        <div style={{ paddingTop: 6 }}>
          <input
            type="range"
            className="ms-slider"
            value={range}
            onChange={(e) => setRange(+e.target.value)}
            style={{
              background: `linear-gradient(to right, var(--c-primary) ${range}%, color-mix(in srgb, var(--c-text) 12%, var(--c-border)) ${range}%)`,
            }}
          />
          <div className="ms-hint" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>min</span>
            <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>{range}</span>
            <span>max</span>
          </div>
        </div>
      );

    case 'knob':
      return (
        <svg width="96" height="96" viewBox="0 0 100 100" onClick={() => setRange((range + 10) % 110)} style={{ cursor: 'pointer' }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--c-border)" strokeWidth="10" strokeDasharray="188 252" transform="rotate(125 50 50)" strokeLinecap="round" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--c-primary)" strokeWidth="10" strokeDasharray={`${(188 * range) / 100} 252`} transform="rotate(125 50 50)" strokeLinecap="round" />
          <text x="50" y="56" textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--c-text)">
            {range}
          </text>
        </svg>
      );

    case 'rating':
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={22}
              onClick={() => setStars(i)}
              style={{ cursor: 'pointer', color: i <= stars ? 'var(--c-primary)' : 'var(--c-border)' }}
              fill={i <= stars ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      );

    case 'colorPicker':
      return (
        <label style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--c-primary)', border: '1px solid var(--c-border)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
          <input type="color" style={{ opacity: 0, position: 'absolute', inset: 0 }} />
        </label>
      );

    case 'fileUpload':
      return (
        <div className="ms-drop">
          <UploadCloud size={22} style={{ margin: '0 auto 6px', color: 'var(--c-primary)' }} />
          <span style={{ color: 'var(--c-primary)', fontWeight: 600 }}>Wybierz plik</span> lub przeciągnij tutaj
          <div style={{ fontSize: 11.5, marginTop: 4 }}>PDF, JPG do 10 MB</div>
        </div>
      );

    case 'address':
      return (
        <div className="grid grid-cols-12" style={{ gap: 10 }}>
          <input className="ms-input col-span-8" placeholder="Ulica" />
          <input className="ms-input col-span-2" placeholder="Nr" />
          <input className="ms-input col-span-2" placeholder="Lok." />
          <input className="ms-input col-span-4" placeholder="__-___" />
          <input className="ms-input col-span-8" placeholder="Miejscowość" />
        </div>
      );

    case 'readonly':
      return (
        <div className="ms-readonly">
          <Lock size={14} style={{ color: 'var(--c-muted)' }} />
          <span className="ms-skel" style={{ width: '45%' }} />
          {source && (
            <span className="ms-badge" style={{ marginLeft: 'auto' }}>
              {source}
            </span>
          )}
        </div>
      );
  }
}
