import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { exampleMockup } from './defaults';
import { fromYaml, toYaml } from '../io/yaml';
import { toPrompt } from '../export/toPrompt';
import { validateMockup } from './validate';

describe('YAML', () => {
  it('round-trip przykładu jest stabilny', () => {
    const y1 = toYaml(exampleMockup());
    const y2 = toYaml(fromYaml(y1));
    expect(y2).toBe(y1);
  });

  it('examples/*.mockup.yaml jest poprawny i stabilny', () => {
    const text = readFileSync(new URL('../../examples/wniosek-kredytowy.mockup.yaml', import.meta.url), 'utf8');
    expect(toYaml(fromYaml(text))).toBe(text);
  });

  it('odrzuca span > 12 i nieznaną kontrolkę', () => {
    const y = toYaml(exampleMockup()).replace('span: 4', 'span: 14');
    expect(() => fromYaml(y)).toThrow(/span/);
    const y2 = toYaml(exampleMockup()).replace('control: slider', 'control: magic');
    expect(() => fromYaml(y2)).toThrow(/control/);
  });
});

describe('walidacja', () => {
  it('przykład jest spójny', () => {
    expect(validateMockup(exampleMockup())).toEqual([]);
  });

  it('łapie przejście do nieistniejącego kroku i przepełniony wiersz', () => {
    const m = exampleMockup();
    m.steps[0].transitions![1].to = 's9';
    m.steps[0].sections[0].rows[0][0].span = 8;
    const msgs = validateMockup(m).map((i) => i.message).join('\n');
    expect(msgs).toMatch(/s9/);
    expect(msgs).toMatch(/16\/12/);
  });
});

describe('prompt', () => {
  it('zawiera tokeny, mapowanie kontrolek, mermaid i YAML', () => {
    const p = toPrompt(exampleMockup());
    expect(p).toContain('| color-primary | #2F5BEA |');
    expect(p).toContain('`p-inputMask`');
    expect(p).toContain('`p-slider` | SliderModule | https://v17.primeng.org/slider');
    expect(p).toContain('s1 --> s2: Dalej');
    expect(p).toContain('span 4: **NIP**');
    expect(p).toContain('on blur → call „GUS: pobierz dane firmy”, potem: wypełnij');
    expect(p).toContain('```yaml');
    expect(p).toContain('[options] ze słownika backendu `CEL_KREDYTU`');
  });

  it('słownik na elemencie nadpisuje dane i spełnia walidację', () => {
    const m = exampleMockup();
    m.steps[0].sections[0].rows.push([{ id: 'el-dd', kind: 'field', bind: 'company.nip', control: 'dropdown', dictionary: 'KRAJE', span: 12 }]);
    expect(validateMockup(m)).toEqual([]);
    expect(toPrompt(m)).toContain('[options] ze słownika backendu `KRAJE`');
    expect(toYaml(fromYaml(toYaml(m)))).toBe(toYaml(m));
  });
});

describe('nowe kroki', () => {
  it('mają Wstecz po lewej i Dalej po prawej, a Dalej poprzedniego wskazuje nowy krok', async () => {
    const { useMockup } = await import('../store/useMockup');
    const { emptyMockup } = await import('./defaults');
    const { transitionAlign } = await import('./schema');
    const st = useMockup.getState();
    st.setMockup(emptyMockup());
    st.addStep();
    st.addStep();
    const [s1, s2, s3] = useMockup.getState().mockup.steps;
    expect(s1.transitions?.map((t) => [t.label, t.to, transitionAlign(t)])).toEqual([['Dalej', 's2', 'right']]);
    expect(s2.transitions?.map((t) => [t.label, t.to, transitionAlign(t)])).toEqual([
      ['Wstecz', 's1', 'left'],
      ['Dalej', 's3', 'right'],
    ]);
    expect(s3.transitions?.map((t) => [t.label, t.to ?? null, transitionAlign(t)])).toEqual([
      ['Wstecz', 's2', 'left'],
      ['Dalej', null, 'right'],
    ]);
  });
});

describe('linki do wzorców kontrolek', () => {
  it('trafiają do YAML (stabilnie) i do promptu', () => {
    const m = exampleMockup();
    m.theme.controlRefs = { checkbox: 'https://storybook.example/checkbox', inputMask: 'https://storybook.example/mask' };
    const y = toYaml(m);
    expect(y.indexOf('inputMask: https')).toBeLessThan(y.indexOf('checkbox: https'));
    expect(toYaml(fromYaml(y))).toBe(y);
    const p = toPrompt(m);
    expect(p).toContain('| inputMask — InputMask — maska (NIP, PESEL, kod…) | `p-inputMask` | InputMaskModule | 🔗 https://storybook.example/mask |');
    expect(p).toContain('- checkbox `p-checkbox`: 🔗 https://storybook.example/checkbox');
  });
});

describe('migracja starych makiet', () => {
  it('mapuje dawne kontrolki na PrimeNG', () => {
    const y = toYaml(exampleMockup()).replace('control: slider', 'control: radio-cards');
    const withRefs = y.replace('  shadow: soft', '  shadow: soft\n  controlRefs:\n    id-field: https://x.example/id');
    const m = fromYaml(withRefs);
    const el = m.steps[1].sections[0].rows[0][1];
    expect(el.kind === 'field' && el.control).toBe('radioButton');
    expect(m.theme.controlRefs).toEqual({ inputMask: 'https://x.example/id' });
  });
});

describe('kolumny w wierszu', () => {
  it('+ kolumna dzieli wiersz równo, podział wkłada elementy do 1. kolumny, elementy lądują w kolumnie', async () => {
    const { useMockup, locateElement } = await import('../store/useMockup');
    const st = useMockup.getState();
    st.setMockup(exampleMockup());
    const sec = () => useMockup.getState().mockup.steps[0].sections[0];
    // wiersz 1: NIP (4) + Nazwa (8) → + kolumna → 3 komórki po 4
    st.addColumn(sec().id, 0);
    expect(sec().rows[0].map((e) => [e.kind, e.span])).toEqual([
      ['field', 4],
      ['field', 4],
      ['column', 4],
    ]);
    // pusty wiersz → podział na 3 kolumny
    st.addRow(sec().id);
    const r = sec().rows.length - 1;
    st.splitRow(sec().id, r, 3);
    const cols = sec().rows[r];
    expect(cols.map((c) => [c.kind, c.span])).toEqual([
      ['column', 4],
      ['column', 4],
      ['column', 4],
    ]);
    // dodanie elementu do 2. kolumny i przeniesienie NIP do 3. kolumny
    st.addElement(sec().id, r, 'text', { text: 'Opis' }, cols[1].id);
    st.moveElement('el-nip', sec().id, r, 0, cols[2].id);
    const after = sec().rows[r];
    expect(after[1].kind === 'column' && after[1].items.map((x) => x.kind)).toEqual(['text']);
    expect(after[2].kind === 'column' && after[2].items.map((x) => x.id)).toEqual(['el-nip']);
    expect(locateElement(useMockup.getState().mockup, 'el-nip')?.column?.id).toBe(cols[2].id);

    const m = useMockup.getState().mockup;
    expect(validateMockup(m)).toEqual([]);
    const y = toYaml(m);
    expect(toYaml(fromYaml(y))).toBe(y);
    expect(toPrompt(m)).toMatch(/span 4: KOLUMNA \[\*\*NIP\*\* `p-inputMask`/);
  });
});

describe('własny wygląd', () => {
  it('parsuje CSS, trafia do YAML i do promptu', async () => {
    const { parseCss, styleToCss } = await import('./style');
    expect(parseCss('letter-spacing: 1px; --c-primary: #E11D48; ')).toEqual({ letterSpacing: '1px', '--c-primary': '#E11D48' });
    const m = exampleMockup();
    const el = m.steps[0].sections[0].rows[2][0];
    el.style = { background: 'warning', borderWidth: 2, radius: 16, css: 'text-transform: uppercase', note: 'baner ostrzegawczy' };
    m.steps[0].sections[0].style = { shadow: 'strong' };
    m.theme.customCss = '.ms-input { border-width: 2px; }';
    expect(styleToCss(m.theme, el.style)).toMatchObject({ background: '#D97706', borderWidth: '2px', borderRadius: '16px', textTransform: 'uppercase' });
    const y = toYaml(m);
    expect(toYaml(fromYaml(y))).toBe(y);
    const p = toPrompt(m);
    expect(p).toContain('🎨 własny wygląd: tło warning, ramka 2px border, zaokrąglenie 16px, CSS: `text-transform: uppercase`, opis: „baner ostrzegawczy”');
    expect(p).toContain('🎨 własny wygląd sekcji: cień strong');
    expect(p).toContain('.ms-input { border-width: 2px; }');
  });
});

describe('kroki opcjonalne', () => {
  it('waliduje warunek, eksportuje opis i pominięcie w Mermaid', async () => {
    const { useMockup } = await import('../store/useMockup');
    const st = useMockup.getState();
    st.setMockup(exampleMockup());
    st.addStep({ optional: true });
    st.addStep();
    let m = useMockup.getState().mockup;
    const opt = m.steps[2];
    expect(opt.optional).toBe(true);
    expect(validateMockup(m).map((i) => i.message).join()).toMatch(/nie ma opisanego warunku/);
    st.updateStep(opt.id, { when: 'loan.hasCollateral = Tak' });
    m = useMockup.getState().mockup;
    expect(validateMockup(m).filter((i) => i.stepId === opt.id)).toEqual([]);
    const y = toYaml(m);
    expect(y).toContain('optional: true\n    when: loan.hasCollateral = Tak');
    expect(toYaml(fromYaml(y))).toBe(y);
    const p = toPrompt(m);
    expect(p).toContain('— OPCJONALNY');
    expect(p).toContain('Uruchamia się, gdy: loan.hasCollateral = Tak');
    expect(p).toContain('s2 --> s4: pomiń s3 [gdy NIE: loan.hasCollateral = Tak]');
    expect(p).not.toContain('s4 --> s4');
  });
});
