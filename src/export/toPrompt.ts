import { transitionAlign, type Action, type LeafElement, type Mockup } from '../model/schema';
import { controlInfo, CONTROLS, DEFAULT_CONTROL, IMPLICIT_OPTIONS, MASKS, PRIMENG_DOCS, SEMANTIC_LABELS } from '../model/controls';
import { resolveBind, sectionLeaves } from '../model/defaults';
import { toYaml } from '../io/yaml';
import { describeStyle } from '../model/style';

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function action(a: Action): string {
  const head = [`on ${a.event}`, a.when ? `gdy ${a.when}` : '', `→ ${a.do}${a.target ? ` „${a.target}”` : ''}`].filter(Boolean).join(' ');
  return a.then ? `${head}, potem: ${a.then}` : head;
}

function describe(m: Mockup, el: LeafElement): { cell: string; details: string[] } {
  const details: string[] = [];
  const color = el.color ? `, kolor: ${el.color}` : '';
  let cell: string;
  switch (el.kind) {
    case 'field': {
      const f = resolveBind(m, el.bind);
      const control = el.control ?? (f ? DEFAULT_CONTROL[f.type] : 'inputText');
      const info = controlInfo(control);
      const label = el.label ?? f?.label ?? el.bind ?? 'pole';
      const req = el.required ?? f?.required;
      const dict = el.options ? undefined : el.dictionary ?? f?.dictionary;
      cell = `**${label}** \`${info.tag}\` (${control}${f ? `, typ ${f.type}` : ''}${control === 'readonly' ? '' : req ? ', wymagane' : ', opcjonalne'})`;
      if (el.bind) details.push(`dane: \`${el.bind}\`${f?.source ? ` (źródło: ${f.source})` : ''}`);
      const opts = el.options ?? f?.options ?? (f ? IMPLICIT_OPTIONS[f.type] : undefined);
      if (dict) details.push(`[options] ze słownika backendu \`${dict}\` (DictionaryService, cache)`);
      else if (opts?.length) details.push(`opcje: ${opts.join(' / ')}`);
      if (control === 'checkbox') details.push(opts?.length && !dict ? 'grupa checkboxów (kilka p-checkbox z tym samym modelem)' : 'pojedynczy p-checkbox [binary]="true"');
      if (control === 'inputMask' && f && MASKS[f.type]) details.push(`mask="${MASKS[f.type]}"`);
      if (control === 'inputNumber' && f?.type === 'amount') details.push('mode="currency" currency="PLN" locale="pl-PL"');
      if (control === 'calendar' && f?.type === 'date-range') details.push('selectionMode="range"');
      if (control === 'calendar') details.push('dateFormat="dd.mm.yy"');
      if (el.placeholder) details.push(`placeholder: „${el.placeholder}”`);
      if (el.hint) details.push(`hint: „${el.hint}”`);
      el.on?.forEach((a) => details.push(action(a)));
      break;
    }
    case 'text':
      cell = `tekst ${el.level ?? 'body'}: „${esc(el.text)}”${color}`;
      break;
    case 'info':
      cell = `komunikat ${el.variant ?? 'info'}${el.title ? ` „${esc(el.title)}”` : ''}: „${esc(el.text)}”`;
      break;
    case 'button':
      cell = `przycisk ${el.variant ?? 'secondary'} „${esc(el.label)}”${color}`;
      el.on?.forEach((a) => details.push(action(a)));
      break;
    case 'table':
      cell = `tabela${el.title ? ` „${esc(el.title)}”` : ''}${el.entity ? ` z danych \`${el.entity}\`` : ''}`;
      if (el.columns?.length) details.push(`kolumny: ${el.columns.join(', ')}`);
      if (el.rowActions?.length) details.push(`akcje wiersza: ${el.rowActions.join(', ')}`);
      break;
    case 'placeholder':
      cell = `🔲 DO ZAPROJEKTOWANIA: „${esc(el.text)}”`;
      break;
  }
  const look = describeStyle(el.style);
  if (look) details.push(`🎨 własny wygląd: ${look}`);
  if (el.aiHint) details.push(`💡 AI: ${el.aiHint}`);
  return { cell: `span ${el.span}: ${cell}${look ? ' 🎨' : ''}`, details };
}

export function toPrompt(m: Mockup): string {
  const out: string[] = [];
  const t = m.theme;
  out.push(`# Zaprojektuj w Angularze: ${m.name}`);
  if (m.description) out.push('', m.description);
  out.push(
    '',
    '## Zadanie',
    '',
    'Na podstawie poniższej makiety wygeneruj wizard w Angularze: jeden komponent na krok, wspólny shell ze stepperem, ' +
      'Reactive Forms z walidacją, nawigacja zgodnie z przejściami. Zachowaj układ siatki 12 kolumn (span), kolejność sekcji i pól. ' +
      'KOLUMNA [a ↓ b] to kolumna siatki o danej szerokości, w której elementy stoją jeden pod drugim. ' +
      `UI buduj wyłącznie z komponentów PrimeNG 17 (${PRIMENG_DOCS}): kontrolki z mapowania poniżej, przyciski p-button, ` +
      'komunikaty p-message, tabele p-table, stepper p-steps, sekcje p-card. ' +
      'Elementy „DO ZAPROJEKTOWANIA” zaprojektuj samodzielnie według opisu, też z komponentów PrimeNG. ' +
      'Wskazówki oznaczone 💡 AI mają pierwszeństwo przed domyślnym zachowaniem. ' +
      'Kroki OPCJONALNE pokazuj tylko, gdy spełniony jest ich warunek uruchomienia — inaczej nawigacja je pomija.',
  );
  if (m.aiContext) out.push('', '### Kontekst techniczny', '', m.aiContext);

  out.push(
    '',
    '## Wygląd (design tokens)',
    '',
    'Styl nowoczesny: zaokrąglone rogi, sekcje jako karty z miękkim cieniem, label nad polem, hint pod polem (błąd zastępuje hint), ' +
      'wyraźny focus ring w kolorze primary, przyciski z wariantami. Zdefiniuj tokeny jako CSS custom properties / SCSS variables ' +
      '(nie hardkoduj hexów w komponentach).',
    '',
    '| token | wartość |',
    '|---|---|',
    ...Object.entries(t.colors).map(([k, v]) => `| color-${k} | ${v} |`),
    `| radius | ${t.radius}px |`,
    `| density | ${t.density} |`,
    `| font | ${t.font} |`,
    `| shadow | ${t.shadow} |`,
  );
  out.push(
    '',
    'Elementy oznaczone 🎨 mają własny wygląd, który nadpisuje motyw — odwzoruj go (najlepiej jako klasę CSS komponentu, kolory jako tokeny).',
  );
  if (t.customCss)
    out.push(
      '',
      '### Własny CSS makiety',
      '',
      'Klasy `.ms-*` to kontrolki makiety (np. `.ms-input` = pole tekstowe, `.ms-btn.primary` = główny przycisk, `.ms-card` = sekcja). ' +
        'Przenieś te reguły na odpowiedniki PrimeNG (np. `.p-inputtext`, `.p-button`, `.p-card`).',
      '',
      '```css',
      t.customCss.trim(),
      '```',
    );

  const usedControls = new Set<string>();
  m.steps.forEach((s) =>
    s.sections.forEach((sec) =>
      sectionLeaves(sec).forEach((el) => {
        if (el.kind !== 'field') return;
        const f = resolveBind(m, el.bind);
        usedControls.add(el.control ?? (f ? DEFAULT_CONTROL[f.type] : 'inputText'));
      }),
    ),
  );
  const refs = t.controlRefs ?? {};
  out.push(
    '',
    '## Mapowanie kontrolek → PrimeNG 17 (używane w makiecie)',
    '',
    'Dla każdej kontrolki otwórz link z kolumny „wzorzec” i użyj API komponentu zgodnie z nim (inputy, warianty, stany). ' +
      'Własny wzorzec (oznaczony 🔗) ma pierwszeństwo przed dokumentacją i ogólnym stylem z tokenów.',
    '',
    '| kontrolka | komponent PrimeNG | moduł | wzorzec |',
    '|---|---|---|---|',
  );
  CONTROLS.filter((c) => usedControls.has(c.id)).forEach((c) =>
    out.push(`| ${c.id} — ${c.label} | \`${c.tag}\` | ${c.module} | ${refs[c.id] ? `🔗 ${refs[c.id]}` : c.doc} |`),
  );
  const unusedRefs = CONTROLS.filter((c) => !usedControls.has(c.id) && refs[c.id]);
  if (unusedRefs.length) {
    out.push('', 'Pozostałe wzorce (mogą przydać się przy elementach „DO ZAPROJEKTOWANIA”):', '');
    unusedRefs.forEach((c) => out.push(`- ${c.id} \`${c.tag}\`: 🔗 ${refs[c.id]}`));
  }

  if (m.data.length) {
    out.push('', '## Model danych', '');
    for (const e of m.data) {
      out.push(`### \`${e.entity}\`${e.label ? ` — ${e.label}` : ''}`, '', '| pole | etykieta | typ | wymagane | źródło / uwagi |', '|---|---|---|---|---|');
      e.fields.forEach((f) =>
        out.push(
          `| \`${e.entity}.${f.id}\` | ${esc(f.label)} | ${f.type} (${SEMANTIC_LABELS[f.type]}) | ${f.required ? 'tak' : 'nie'} | ${esc(
            [f.dictionary ? `słownik ${f.dictionary}` : '', f.source, f.options?.join(' / '), f.description].filter(Boolean).join('; '),
          )} |`,
        ),
      );
      out.push('');
    }
  }

  out.push('', '## Przepływ', '', '```mermaid', 'stateDiagram-v2');
  if (m.steps[0]) out.push(`  [*] --> ${m.steps[0].id}`);
  m.steps.forEach((s) => out.push(`  ${s.id}: ${s.title.replace(/:/g, ' ')}${s.optional ? ' (opcjonalny)' : ''}`));
  m.steps.forEach((s) =>
    (s.transitions ?? []).forEach((tr) => {
      if (!tr.to) return;
      const target = m.steps.find((x) => x.id === tr.to);
      const cond = [tr.when, target?.optional ? `tylko gdy: ${target.when ?? '?'}` : ''].filter(Boolean).join('; ');
      out.push(`  ${s.id} --> ${tr.to}: ${tr.label}${cond ? ` [${cond.replace(/[:\]]/g, ' ')}]` : ''}`);
    }),
  );
  m.steps.forEach((s, i) => {
    if (!s.optional) return;
    const skip = s.skipTo ?? m.steps.slice(i + 1).find((x) => !x.optional)?.id;
    m.steps
      .filter((p, pi) => pi < i && (p.transitions ?? []).some((t) => t.to === s.id))
      .forEach((p) => out.push(`  ${p.id} --> ${skip ?? '[*]'}: pomiń ${s.id} [gdy NIE: ${(s.when ?? '?').replace(/[:\]]/g, ' ')}]`));
  });
  out.push('```');

  out.push('', '## Kroki');
  m.steps.forEach((s, i) => {
    out.push('', `### Krok ${i + 1}: ${s.title} (\`${s.id}\`)${s.optional ? ' — OPCJONALNY' : ''}`);
    if (s.purpose) out.push('', `**Cel:** ${s.purpose}`);
    if (s.optional) {
      const skip = m.steps.find((x) => x.id === s.skipTo) ?? m.steps.slice(i + 1).find((x) => !x.optional);
      out.push(
        '',
        `**Krok opcjonalny.** Uruchamia się, gdy: ${s.when || '(nie opisano)'}. ` +
          `Gdy warunek nie jest spełniony, krok jest pomijany i wizard przechodzi do: ${skip ? `\`${skip.id}\` ${skip.title}` : 'końca'}. ` +
          'Krok widoczny w stepperze jako opcjonalny; warunek liczony z danych formularza (computed/signal), nie zapisuj go na sztywno.',
      );
    } else if (s.when) out.push('', `**Uruchamia się:** ${s.when}`);
    if (s.aiHint) out.push('', `💡 AI: ${s.aiHint}`);
    s.sections.forEach((sec) => {
      out.push('', `#### Sekcja: ${sec.title ?? '(bez tytułu)'}${sec.emphasis && sec.emphasis !== 'card' ? ` [${sec.emphasis}]` : ''}`);
      if (sec.description) out.push(`_${sec.description}_`);
      if (sec.aiHint) out.push(`💡 AI: ${sec.aiHint}`);
      const secLook = describeStyle(sec.style);
      if (secLook) out.push(`🎨 własny wygląd sekcji: ${secLook}`);
      const details: string[] = [];
      sec.rows.forEach((row, r) => {
        if (!row.length) return;
        const cells = row.map((el) => {
          if (el.kind === 'column') {
            const inner = el.items.map((x) => {
              const d = describe(m, x);
              d.details.forEach((y) => details.push(`- \`${x.id}\` ${y}`));
              return d.cell.replace(/^span \d+: /, '');
            });
            if (el.aiHint) details.push(`- \`${el.id}\` 💡 AI: ${el.aiHint}`);
            const colLook = describeStyle(el.style);
            if (colLook) details.push(`- \`${el.id}\` 🎨 własny wygląd kolumny: ${colLook}`);
            return `span ${el.span}: KOLUMNA${el.title ? ` „${esc(el.title)}”` : ''} [${inner.length ? inner.join(' ↓ ') : 'pusta'}]`;
          }
          const d = describe(m, el);
          d.details.forEach((x) => details.push(`- \`${el.id}\` ${x}`));
          return d.cell;
        });
        out.push(`- wiersz ${r + 1}: ${cells.join(' ‖ ')}`);
      });
      if (details.length) out.push('', 'Zachowania i szczegóły:', ...details);
    });
    if (s.transitions?.length) {
      out.push('', '**Przyciski nawigacji:**');
      s.transitions.forEach((tr) =>
        out.push(
          `- ${transitionAlign(tr) === 'right' ? 'po prawej' : 'po lewej'}: ${tr.variant ?? 'primary'} „${tr.label}”${tr.to ? ` → krok \`${tr.to}\`` : ''}${tr.do ? ` → ${tr.do}` : ''}${tr.when ? ` (gdy: ${tr.when})` : ''}`,
        ),
      );
    }
  });

  out.push('', '## Źródło prawdy (YAML)', '', '```yaml', toYaml(m).trimEnd(), '```', '');
  return out.join('\n');
}
