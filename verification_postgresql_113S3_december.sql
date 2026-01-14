-- ============================================================================
-- POSTGRESQL VERIFICATION QUERY
-- ============================================================================
-- Compare this result with SSMS output
-- Product: 113S3_ocieplane_42
-- Period: 1-30 December 2025
-- ============================================================================

-- Query 1: Summary by branch
SELECT 
    b.symbol as "Oddział",
    COUNT(*) as "Liczba Dokumentów",
    SUM(s.quantity) as "Suma Sztuk"
FROM "Sale" s
JOIN "Product" p ON s."productId" = p.id
JOIN "Branch" b ON s."branchId" = b.id
WHERE p.sku = '113S3_ocieplane_42'
  AND s.date >= '2025-12-01'
  AND s.date < '2025-12-31'
GROUP BY b.symbol
ORDER BY "Suma Sztuk" DESC;

-- Query 2: Detailed transactions
SELECT 
    s.date as "Data",
    b.symbol as "Oddział",
    s.quantity as "Ilość",
    p.sku as "SKU",
    p.name as "Nazwa"
FROM "Sale" s
JOIN "Product" p ON s."productId" = p.id
JOIN "Branch" b ON s."branchId" = b.id
WHERE p.sku = '113S3_ocieplane_42'
  AND s.date >= '2025-12-01'
  AND s.date < '2025-12-31'
ORDER BY s.date, s.id;

-- Query 3: Check for negative values (returns/corrections)
SELECT 
    COUNT(*) as "Liczba zwrotów",
    SUM(quantity) as "Suma zwrotów"
FROM "Sale" s
JOIN "Product" p ON s."productId" = p.id
WHERE p.sku = '113S3_ocieplane_42'
  AND s.date >= '2025-12-01'
  AND s.date < '2025-12-31'
  AND s.quantity < 0;

-- ============================================================================
-- EXPECTED COMPARISON:
-- ============================================================================
-- SSMS (Subiekt)          vs     PostgreSQL (Our DB)
-- -----------------              --------------------
-- Liczba Dokumentów   =?=        Liczba Dokumentów
-- Suma Sztuk          =?=        Suma Sztuk
-- Oddział             =?=        Oddział
--
-- If numbers DON'T match:
-- 1. Check KROK 3 in SSMS - are there WZK or RW documents?
-- 2. If PostgreSQL > SSMS: We have duplicates (BAD)
-- 3. If PostgreSQL < SSMS: Data not synced (BAD)
-- 4. If exact match: System is CORRECT (GOOD!)
-- ============================================================================
