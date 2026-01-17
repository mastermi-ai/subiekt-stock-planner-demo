-- ============================================================================
-- VERIFICATION QUERY FOR SSMS (Subiekt Database)
-- ============================================================================
-- Product: 113S3_ocieplane_42
-- Period: 1 December 2025 - 30 December 2025
-- Purpose: Verify sales data between Subiekt and our PostgreSQL database
-- ============================================================================

-- KROK 1: Podsumowanie sprzedaży (porównaj z naszą bazą)
-- ========================================================================
-- UPROSZCZONE - bez JOIN do oddziałów, żeby uniknąć problemów z nazwami tabel
SELECT 
    COUNT(DISTINCT d.Id) as [Liczba Dokumentów],
    SUM(CASE 
        WHEN d.Symbol IN ('WZK', 'ZW') THEN -p.Ilosc
        ELSE p.Ilosc 
    END) as [Suma Sztuk],
    COALESCE(d.MiejsceWprowadzeniaId, 100000) as [BranchId]
FROM ModelDanychContainer.PozycjeDokumentu p
JOIN ModelDanychContainer.Dokumenty d ON p.Dokument_Id = d.Id
WHERE p.AsortymentAktualnyId = (
    SELECT Id FROM ModelDanychContainer.Asortymenty WHERE Symbol = '113S3_ocieplane_42'
)
  AND d.Symbol IN ('WZ', 'WZK', 'RW')
  AND d.DataWydaniaWystawienia >= '2025-12-01'
  AND d.DataWydaniaWystawienia < '2025-12-31'
GROUP BY COALESCE(d.MiejsceWprowadzeniaId, 100000)
ORDER BY [Suma Sztuk] DESC;

-- UWAGA: Wynik pokazuje BranchId zamiast symbolu oddziału
-- Porównaj BranchId z naszą bazą PostgreSQL (Branch.Id)

-- ============================================================================
-- KROK 2: Szczegółowa lista transakcji (debug)
-- ============================================================================
-- UPROSZCZONE - bez numeru dokumentu (kolumna może się różnić w wersjach Subiekta)
SELECT 
    d.DataWydaniaWystawienia as [Data],
    d.Symbol as [Typ Dok],
    CASE 
        WHEN d.Symbol IN ('WZK', 'ZW') THEN -p.Ilosc
        ELSE p.Ilosc 
    END as [Ilość],
    jo.Symbol as [Oddział],
    a.Symbol as [SKU],
    a.Nazwa as [Nazwa Produktu],
    d.Id as [DokumentId]
FROM ModelDanychContainer.PozycjeDokumentu p
JOIN ModelDanychContainer.Dokumenty d ON p.Dokument_Id = d.Id
JOIN ModelDanychContainer.Asortymenty a ON p.AsortymentAktualnyId = a.Id
LEFT JOIN ModelDanychContainer.JednostkiOrganizacyjne jo ON d.MiejsceWprowadzeniaId = jo.Id
WHERE a.Symbol = '113S3_ocieplane_42'
  AND d.Symbol IN ('WZ', 'WZK', 'RW')
  AND d.DataWydaniaWystawienia >= '2025-12-01'
  AND d.DataWydaniaWystawienia < '2025-12-31'
ORDER BY d.DataWydaniaWystawienia, d.Id;

-- ============================================================================
-- KROK 3: Weryfikacja typów dokumentów (czy są WZK lub RW?)
-- ============================================================================
SELECT 
    d.Symbol as [Typ Dokumentu],
    COUNT(DISTINCT d.Id) as [Liczba Dokumentów],
    SUM(CASE 
        WHEN d.Symbol IN ('WZK', 'ZW') THEN -p.Ilosc
        ELSE p.Ilosc 
    END) as [Suma Sztuk]
FROM ModelDanychContainer.PozycjeDokumentu p
JOIN ModelDanychContainer.Dokumenty d ON p.Dokument_Id = d.Id
WHERE p.AsortymentAktualnyId = (
    SELECT Id FROM ModelDanychContainer.Asortymenty WHERE Symbol = '113S3_ocieplane_42'
)
  AND d.Symbol IN ('WZ', 'WZK', 'RW')
  AND d.DataWydaniaWystawienia >= '2025-12-01'
  AND d.DataWydaniaWystawienia < '2025-12-31'
GROUP BY d.Symbol
ORDER BY [Suma Sztuk] DESC;

-- ============================================================================
-- OCZEKIWANE WYNIKI (do porównania z PostgreSQL):
-- ============================================================================
-- Po uruchomieniu tych zapytań, porównaj wyniki z naszą bazą PostgreSQL:
--
-- PostgreSQL Query:
-- SELECT 
--     b.symbol as oddział,
--     COUNT(*) as liczba_dokumentów,
--     SUM(s.quantity) as suma_sztuk
-- FROM "Sale" s
-- JOIN "Product" p ON s."productId" = p.id
-- JOIN "Branch" b ON s."branchId" = b.id
-- WHERE p.sku = '113S3_ocieplane_42'
--   AND s.date >= '2025-12-01'
--   AND s.date < '2025-12-31'
-- GROUP BY b.symbol;
--
-- UWAGI:
-- 1. Jeśli liczby się nie zgadzają, sprawdź KROK 3 (typy dokumentów)
-- 2. WZK i RW mogą być przyczyną rozbieżności
-- 3. Jeśli mamy więcej w PostgreSQL niż w Subiekcie - mamy problem z duplikatami
-- 4. Jeśli mamy mniej w PostgreSQL niż w Subiekcie - coś się nie zsynchronizowało
-- ============================================================================
