# Mockup Studio

Low-code edytor makiet wizarda. Wyklikujesz kroki, sekcje, pola i przejścia, a na wyjściu dostajesz
plik **YAML** (źródło prawdy) i **prompt Markdown**, z którego LLM generuje właściwy wizard w Angularze.

```bash
npm install
npm run dev        # http://localhost:5199
npm test           # round-trip YAML, walidacja, eksport promptu
npm run gen-schema # mockup.schema.json + examples/*.mockup.yaml
```

## Jak używać

- **Kroki** (lewy panel): `+ Krok` i `+ Opcjonalny`, kolejność, duplikowanie. Każdy krok ma cel („co się tu dzieje”), opis kiedy się
  uruchamia, podpowiedź dla AI i przejścia. Krok opcjonalny ma warunek uruchomienia i cel pominięcia (gdy warunek niespełniony).
- **Canvas**: krok → sekcje (karty) → wiersze w siatce 12 kolumn. Klikasz `+` w wolnym miejscu wiersza i wybierasz
  element: pole, tekst, komunikat, przycisk, tabelę albo placeholder „do zaprojektowania przez AI”. Elementy można
  przeciągać, a szerokość zmieniasz uchwytem po prawej albo w inspektorze.
- **Wiersze i kolumny**: po najechaniu na wiersz pojawia się pasek: przesuwanie wiersza ↑↓, **+ kolumna** (wiersz dzieli się
  równo), **podziel na 2/3/4** kolumny, usuwanie wiersza. Kolumna zajmuje część z 12 kolumn siatki i układa elementy jeden pod
  drugim; dodajesz je „+” na dole kolumny albo przeciągasz z innych miejsc.
- **Inspektor** (prawy panel): dane pola (dropdown z modelu danych albo „+ nowe pole danych”), **kontrolka**
  (domyślna z typu danych albo wybrana ręcznie), opcje, hint, wymagalność, **akcje** („on blur → call GUS → wypełnij…”),
  kolor/wariant oraz **podpowiedź dla AI**.
- **Dane**: encje i pola z typem semantycznym (`nip`, `amount`, `dict`, `yes-no`…), zgodnie z domyślną kontrolką PrimeNG 17 dobieraną z typu.
- **Wygląd**: presety (modern, bank-navy, minimal-gray, fresh-green, dark), color pickery, zaokrąglenia, gęstość, cienie, font.
  Kontrolki od razu renderują się w nowoczesnym stylu na tych tokenach.
- **Własny wygląd**: w inspektorze elementu, kolumny i sekcji sekcja „Własny wygląd” — tło, kolor tekstu, ramka, zaokrąglenie,
  padding, font, cień (kolory jako tokeny motywu albo hex), dowolny CSS (także zmienne `--c-primary`, `--radius`) i opis dla AI.
  W zakładce Wygląd jest też globalny własny CSS całej makiety (np. `.ms-input`, `.ms-btn.primary`).
- **AI**: opis, globalny kontekst techniczny dla LLM, lista problemów (np. brak danych w polu, przepełniony wiersz, przejście do nieistniejącego kroku).
- **Podgląd**: klikalny prototyp, w którym przyciski przejść nawigują między krokami.
- **Eksport dla AI**: prompt (tokeny wyglądu, mapowanie kontrolek → komponenty PrimeNG 17 z modułem i linkiem do dokumentacji, model danych, diagram Mermaid, kroki
  wiersz po wierszu, pełny YAML), kopiowanie, pobieranie, zrzut PNG kroku.
- **Zapis**: `Folder` (Chrome/Edge) zapisuje `<nazwa>.mockup.yaml` i `<nazwa>.prompt.md` bezpośrednio do wybranego katalogu.
  Bez folderu `Zapisz` pobiera YAML. `Import` wczytuje YAML. Autosave w localStorage.

Skróty: `Ctrl/Cmd+S` zapis, `Ctrl/Cmd+Z` / `Shift+Ctrl/Cmd+Z` cofnij/ponów, `Delete` usuwa zaznaczony element, `Esc` odznacza.

## Struktura

```
src/model/     schema.ts (zod), controls.ts (kontrolki + mapowanie app-*), themes.ts, defaults.ts, validate.ts
src/store/     useMockup.ts (Zustand + immer + zundo)
src/io/        yaml.ts (stabilna kolejność kluczy), fsAccess.ts
src/export/    toPrompt.ts
src/ui/        canvas/, inspector/, controls/ElementView.tsx, panele
```
