# Fyll inn det som mangler fra Excel-arket

Jeg har gått gjennom begge arkene i `budsjett_2026_2.xlsx` og sammenlignet dem post for post med appen.

## Det som faktisk er komplett

Alle 51 kravene i «Nedbetalingsplan» ligger i appen — samme kreditor, saksnr og beløp, sum 137 050 kr. Lønnstrekket 666130322 (39 582 kr) er med i totalen 176 632 kr. Inntekt, faste utgifter og engangsutgifter per måned stemmer også.

## Det som mangler

1. **Rullerende buffer (inngående/utgående balanse)**
   Excel har «Inng. buffer 1.8 = 0» og en balanse som rulles fra måned til måned: aug 3 672 → sep 6 113 → okt 4 653 → nov 2 125 → des 5 139 → jan 16 809 → feb 13 047. Appen viser bare månedens resultat isolert, ikke oppsamlet saldo.

2. **Skattetrekk i prosent**
   Excel styrer skatt via prosentsats per måned (24 %, 32 %, 30 %). Appen lagrer bare kronebeløpet, så prosenten må regnes ut manuelt når bruttolønn endres.

3. **Skille mellom avtalegiro (auto) og «du betaler manuelt»**
   Excel har egen sum for hva som trekkes automatisk kontra hva du må betale selv (aug: 32 343 manuelt + 6 000 auto). Appen har `auto`-flagget i dataene, men viser det ikke i lister eller summer.

4. **SUM-kolonnen for hele planen**
   Excel summerer hver rad over alle syv månedene (brutto 405 689, netto 265 593, faste 88 396, engangs 27 100, gjeld 137 050, resultat 13 047). Appen har ingen «hele planen»-kolonne.

5. **Avstemming-blokken**
   137 050 + 39 582 = 176 632, med kildeforklaring. Tallet finnes i appen, men ikke selve avstemmingen.

6. **Merknader og milepæler fra arket**
   «Kredinor ferdig oktober · Lowell ferdig november · Riverty ferdig januar», risikonotatet om Lowell/rettsgebyr, og «hent dagsfersk saldo før betaling».

## Forslag til implementering

- **Budsjett-fanen:** ny «Buffer»-rad under Månedens resultat som viser inngående og utgående saldo, beregnet rullerende fra en startbuffer (0) som kan endres.
- **Inntektsdialogen:** felt for skatteprosent som automatisk regner ut skattetrekket når bruttolønn eller prosent endres (kronebeløpet kan fortsatt overstyres).
- **Auto/manuelt:** «AUTO»-merke på avtalegiro-krav i Hjem, Kalender og Gjeld, pluss to summer per måned — «Du betaler manuelt» og «Trekkes automatisk».
- **Ny «Plan totalt»-visning** i Sparing-fanen: SUM-tall for hele perioden + avstemmingsblokken (planlagte krav + lønnstrekk = total gjeld).
- **Milepæler:** kreditor-kort i Gjeld-fanen får «ferdig»-måned, og planens merknader vises som et lite notatkort.

## Teknisk

- `src/lib/gjeldsplan.ts`: legge til `START_BUFFER`, milepæler per kreditor og plan-notater.
- `src/lib/budsjett.ts`: `skattPct` i `MonthIncome`, samt `bufferSeries()` som regner inngående/utgående balanse over `MONTH_KEYS`.
- `src/components/betaling/IncomeDialog.tsx`: prosentfelt koblet til bruttolønn.
- `src/components/betaling/tabs/BudsjettTab.tsx`: buffer-rad og manuelt/auto-summer.
- `src/components/betaling/tabs/{HomeTab,KalenderTab,GjeldTab,SparingTab}.tsx`: AUTO-merke, milepæler, totalvisning og avstemming.
- Ingen databaseendringer — alt ligger fortsatt lokalt på enheten.
