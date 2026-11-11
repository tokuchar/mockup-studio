import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronRight, Search, X } from 'lucide-react';

/** Zamyka panel po kliknięciu poza komponentem. */
function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, close]);
  return ref;
}

/** Panel opcji w stylu PrimeNG (Lara): biały, z cieniem, podświetlenie wybranej pozycji. */
function Panel({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="ms-overlay">
      {header}
      <ul className="ms-overlay-list" role="listbox" onMouseDown={(e) => e.preventDefault()}>
        {children}
      </ul>
    </div>
  );
}

function Item({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <li role="option" aria-selected={selected} className={`ms-overlay-item ${selected ? 'selected' : ''}`} onClick={onClick}>
      {children}
    </li>
  );
}

const Empty = () => <li className="ms-overlay-empty">Brak wyników</li>;

export function PDropdown({ options, placeholder }: { options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState<string | null>(null);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={`ms-input ms-input-wrap ms-trigger ${open ? 'focus' : ''}`} tabIndex={0} onClick={() => setOpen(!open)}>
        <span style={{ flex: 1, color: val ? 'var(--c-text)' : 'var(--c-muted)' }}>{val ?? (placeholder || 'Wybierz…')}</span>
        <ChevronDown size={16} className="ms-adorn" />
      </div>
      {open && (
        <Panel>
          {options.map((o) => (
            <Item
              key={o}
              selected={val === o}
              onClick={() => {
                setVal(o);
                setOpen(false);
              }}
            >
              {o}
            </Item>
          ))}
        </Panel>
      )}
    </div>
  );
}

export function PAutoComplete({ options, placeholder }: { options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useOutside(open, () => setOpen(false));
  const hits = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={`ms-input ms-input-wrap ${open ? 'focus' : ''}`}>
        <Search size={16} className="ms-adorn" />
        <input
          value={q}
          placeholder={placeholder || 'Zacznij pisać…'}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
        />
        {q && <X size={15} className="ms-adorn" style={{ cursor: 'pointer' }} onClick={() => setQ('')} />}
      </div>
      {open && (
        <Panel>
          {hits.length ? (
            hits.map((o) => (
              <Item
                key={o}
                selected={q === o}
                onClick={() => {
                  setQ(o);
                  setOpen(false);
                }}
              >
                {o}
              </Item>
            ))
          ) : (
            <Empty />
          )}
        </Panel>
      )}
    </div>
  );
}

export function PMultiSelect({ options, placeholder }: { options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>(options.slice(0, 2));
  const [q, setQ] = useState('');
  const ref = useOutside(open, () => setOpen(false));
  const toggle = (o: string) => setSel(sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]);
  const hits = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));
  const all = sel.length === options.length;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={`ms-input ms-input-wrap ms-trigger ${open ? 'focus' : ''}`} style={{ flexWrap: 'wrap', minHeight: 44 }} onClick={() => setOpen(!open)}>
        {sel.length === 0 && <span style={{ color: 'var(--c-muted)', flex: 1 }}>{placeholder || 'Wybierz…'}</span>}
        {sel.map((o) => (
          <span key={o} className="ms-chip">
            {o}
            <X
              size={13}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                toggle(o);
              }}
            />
          </span>
        ))}
        <ChevronDown size={16} className="ms-adorn" style={{ marginLeft: 'auto' }} />
      </div>
      {open && (
        <Panel
          header={
            <div className="ms-overlay-header">
              <span className={`ms-check-box ${all ? 'on' : ''}`} onClick={() => setSel(all ? [] : [...options])}>
                {all && <Check size={12} strokeWidth={3} />}
              </span>
              <div className="ms-input ms-input-wrap" style={{ flex: 1, padding: '6px 10px' }}>
                <input placeholder="Szukaj" value={q} onChange={(e) => setQ(e.target.value)} />
                <Search size={14} className="ms-adorn" />
              </div>
            </div>
          }
        >
          {hits.length ? (
            hits.map((o) => (
              <Item key={o} selected={sel.includes(o)} onClick={() => toggle(o)}>
                <span className={`ms-check-box ${sel.includes(o) ? 'on' : ''}`}>{sel.includes(o) && <Check size={12} strokeWidth={3} />}</span>
                {o}
              </Item>
            ))
          ) : (
            <Empty />
          )}
        </Panel>
      )}
    </div>
  );
}

/** TreeSelect / CascadeSelect: opcje jako węzły z przykładowymi dziećmi. */
export function PTreeSelect({ options, placeholder, cascade }: { options: string[]; placeholder: string; cascade?: boolean }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [val, setVal] = useState<string | null>(null);
  const ref = useOutside(open, () => setOpen(false));
  const pick = (v: string) => {
    setVal(v);
    setOpen(false);
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={`ms-input ms-input-wrap ms-trigger ${open ? 'focus' : ''}`} onClick={() => setOpen(!open)}>
        <span style={{ flex: 1, color: val ? 'var(--c-text)' : 'var(--c-muted)' }}>{val ?? (placeholder || 'Wybierz…')}</span>
        <ChevronDown size={16} className="ms-adorn" />
      </div>
      {open && (
        <Panel>
          {options.map((o) => (
            <div key={o}>
              <Item selected={val === o} onClick={() => setExpanded(expanded === o ? null : o)}>
                <ChevronRight size={14} style={{ transform: expanded === o ? 'rotate(90deg)' : undefined, transition: 'transform .15s', opacity: 0.6 }} />
                {o}
              </Item>
              {expanded === o &&
                [1, 2].map((i) => {
                  const child = `${o} › ${cascade ? 'poziom 2' : 'element'} ${i}`;
                  return (
                    <Item key={child} selected={val === child} onClick={() => pick(child)}>
                      <span style={{ width: 22 }} />
                      {child.split(' › ')[1]}
                    </Item>
                  );
                })}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
