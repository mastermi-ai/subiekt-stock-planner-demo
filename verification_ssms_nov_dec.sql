-- ============================================================================
-- VERIFICATION QUERY FOR SSMS (Subiekt Database)
-- ============================================================================
-- Product: 113S3_ocieplane_42
-- Period: 1 November 2025 - 31 December 2025 (Extended)
-- Purpose: Verify sales data for longer period matching TeamViewer session
-- ============================================================================

-- KROK 1: Podsumowanie sprzedaży (listopad-grudzień 2025)
-- ========================================================================
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
  AND d.DataWydaniaWystawienia >= '2025-11-01'
  AND d.DataWydaniaWystawienia < '2026-01-01'
GROUP BY COALESCE(d.MiejsceWprowadzeniaId, 100000)
ORDER BY [Suma Sztuk] DESC;

-- UWAGA: Porównaj wynik z PostgreSQL i TeamViewer session (116 pairs reported)

-- ============================================================================
-- KROK 2: Weryfikacja typów dokumentów
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
  AND d.DataWydaniaWystawienia >= '2025-11-01'
  AND d.DataWydaniaWystawienia < '2026-01-01'
GROUP BY d.Symbol
ORDER BY [Suma Sztuk] DESC;

-- ============================================================================
-- OCZEKIWANE WYNIKI:
-- ============================================================================
-- TeamViewer Session (2026-01-12): 116 pairs reported by client
-- PostgreSQL (before fixes): 263 pairs (2.27x overcounting)
-- PostgreSQL (after fixes): Should match SSMS exactly
-- ============================================================================
