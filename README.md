# Planowanie Zamówień - Subiekt nexo PRO Demo

Aplikacja webowa do planowania zamówień na podstawie historycznej sprzedaży. To demo systemu dla klientów korzystających z Subiekt nexo PRO.

## Funkcjonalności

- 📊 Wybór dostawcy z listy
- 📅 Konfiguracja okresu planowania (dni zapasu)
- 📈 Analiza historycznej sprzedaży
- 📋 Wyświetlanie proponowanych zamówień
- 📥 Eksport do pliku Excel

## Technologie

- **Next.js 14+** (App Router)
- **TypeScript**
- **TailwindCSS**
- **SheetJS (xlsx)** - eksport do Excela
- **Lucide React** - ikony

## Uruchomienie lokalnie

### Wymagania
- Node.js 18+ 
- npm

### Instalacja i uruchomienie

```bash
# Zainstaluj zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```

Aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000)

## Wdrożenie na Vercel

### Metoda 1: Przez GitHub

1. Wypchnij kod do repozytorium GitHub
2. Zaloguj się na [vercel.com](https://vercel.com)
3. Kliknij "New Project"
4. Zaimportuj repozytorium
5. Vercel automatycznie wykryje Next.js i skonfiguruje build
6. Kliknij "Deploy"

### Metoda 2: Przez Vercel CLI

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Wdróż projekt
vercel
```

## Struktura projektu

```
subiekt-planning/
├── app/
│   ├── page.tsx          # Główna strona
│   └── globals.css       # Style globalne
├── components/
│   ├── SupplierSelect.tsx
│   ├── PlanForm.tsx
│   ├── PlanTable.tsx
│   └── ExportButton.tsx
├── lib/
│   ├── mockData.ts       # Dane mock (dostawcy, produkty, sprzedaż)
│   └── calculatePlan.ts  # Logika wyliczeń
└── package.json
```

## Logika biznesowa

### Obliczanie zapotrzebowania

Dla każdego produktu:

1. **Średnia dzienna sprzedaż** = suma sprzedaży / okres analizy (dni)
2. **Potrzebne na X dni** = średnia dzienna × dni zapasu (zaokrąglone w górę)
3. **Do zamówienia** = max(0, potrzebne - aktualny stan)

### Dane mock

Aplikacja zawiera:
- 3 dostawców
- 15 produktów
- ~120 dni historii sprzedaży

## Przyszła integracja z Subiekt nexo PRO

W docelowej wersji:
- Dane będą pobierane z API Subiekt nexo PRO
- Możliwość bezpośredniego generowania zamówień
- Synchronizacja stanów magazynowych w czasie rzeczywistym
- Rozbudowana analityka i raporty

## Licencja

Demo application - All rights reserved
