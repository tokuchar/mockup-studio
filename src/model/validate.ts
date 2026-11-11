import type { Mockup } from './schema';
import { resolveBind, rowUsed, sectionLeaves } from './defaults';
import { controlInfo, DEFAULT_CONTROL, IMPLICIT_OPTIONS } from './controls';

export interface Issue {
  stepId?: string;
  elementId?: string;
  message: string;
}

/** Problemy logiczne, których nie łapie sam schemat zod. */
export function validateMockup(m: Mockup): Issue[] {
  const issues: Issue[] = [];
  const stepIds = new Set(m.steps.map((s) => s.id));
  for (const step of m.steps) {
    if (step.optional && !step.when?.trim()) {
      issues.push({ stepId: step.id, message: `Krok opcjonalny „${step.title}” nie ma opisanego warunku uruchomienia` });
    }
    if (step.skipTo && !stepIds.has(step.skipTo)) {
      issues.push({ stepId: step.id, message: `Pominięcie kroku prowadzi do nieistniejącego kroku ${step.skipTo}` });
    }
    for (const t of step.transitions ?? []) {
      if (t.to && !stepIds.has(t.to)) {
        issues.push({ stepId: step.id, message: `Przejście „${t.label}” prowadzi do nieistniejącego kroku ${t.to}` });
      }
    }
    for (const sec of step.sections) {
      sec.rows.forEach((row, i) => {
        const used = rowUsed(row);
        if (used > 12) {
          issues.push({
            stepId: step.id,
            message: `Sekcja „${sec.title ?? sec.id}”, wiersz ${i + 1}: ${used}/12 kolumn`,
          });
        }
      });
      for (const el of sectionLeaves(sec)) {
        if (el.kind !== 'field') continue;
        const field = resolveBind(m, el.bind);
        if (el.bind && !field) {
          issues.push({ stepId: step.id, elementId: el.id, message: `Pole wskazuje na nieistniejące dane ${el.bind}` });
        }
        if (!el.bind) {
          issues.push({ stepId: step.id, elementId: el.id, message: `Pole „${el.label ?? el.id}” nie ma wybranych danych` });
        }
        const control = el.control ?? (field ? DEFAULT_CONTROL[field.type] : 'inputText');
        const opts = el.options ?? field?.options ?? (field ? IMPLICIT_OPTIONS[field.type] : undefined);
        const dict = el.dictionary ?? field?.dictionary;
        if (controlInfo(control).options === 'required' && !opts?.length && !dict) {
          issues.push({ stepId: step.id, elementId: el.id, message: `Kontrolka ${control} bez opcji ani słownika` });
        }
      }
    }
  }
  return issues;
}
