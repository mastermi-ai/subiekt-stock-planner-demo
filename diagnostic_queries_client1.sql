-- ZAPYTANIA DIAGNOSTYCZNE DLA KLIENTA 1 (NEXO PRO)
-- Uruchom w pgAdmin lub innym kliencie PostgreSQL podłączonym do bazy Planner
-- Wyślij screenshoty wyników

-- ===============================================
-- ZAPYTANIE 1: Lista wszystkich oddziałów z ich ID
-- ===============================================
-- Cel: Sprawdzić jakie branchId jest przypisane do "NET"
SELECT 
    id as "Branch ID",
    name as "Branch Name",
    symbol as "Branch Symbol"
FROM "Branch"
ORDER BY id;

-- Oczekiwany wynik: Powinien pokazać NET z konkretnym numerycznym ID (np. 100001, 100002, itp.)


-- ===============================================
-- ZAPYTANIE 2: Sprawdź stany magazynowe dla produktu 113S3_ocieplane_42
-- ===============================================
-- Cel: Zobaczyć które oddziały mają przypisane stany dla tego produktu
SELECT 
    p.sku as "SKU",
    p.name as "Product Name",
    s."branchId" as "Branch ID",
    b.name as "Branch Name",
    s.quantity as "Stock Quantity"
FROM "Stock" s
JOIN "Product" p ON s."productId" = p.id
LEFT JOIN "Branch" b ON s."branchId" = b.id
WHERE p.sku = '113S3_ocieplane_42'
ORDER BY s."branchId";

-- Oczekiwany wynik: Powinien pokazać stany rozłożone po oddziałach
-- Ważne: Sprawdź czy branchId dla NET ma niezerowy stan


-- ===============================================
-- ZAPYTANIE 3: Sprawdź dane sprzedaży dla produktu 113S3_ocieplane_42 (oddział NET, ostatnie 60 dni)
-- ===============================================
-- Cel: Zweryfikować czy dane sprzedaży zgadzają się z Subiektem (111 sprzedanych sztuk)
SELECT 
    s."branchId" as "Branch ID",
    b.name as "Branch Name",
    COUNT(*) as "Number of Sales Records",
    SUM(s.quantity) as "Total Quantity Sold"
FROM "Sale" s
LEFT JOIN "Branch" b ON s."branchId" = b.id
JOIN "Product" p ON s."productId" = p.id
WHERE p.sku = '113S3_ocieplane_42'
  AND s.date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY s."branchId", b.name
ORDER BY s."branchId";

-- Oczekiwany wynik dla NET: Powinien pokazać ~111 suma sprzedanych sztuk
-- Jeśli pokazuje znacznie mniej (np. 41), jest problem z synchronizacją danych


-- ===============================================
-- ZAPYTANIE 4: Policz wszystkie produkty i stany
-- ===============================================
-- Cel: Test poprawności - zweryfikuj czy dane zostały zsynchronizowane
SELECT 
    (SELECT COUNT(*) FROM "Product") as "Total Products",
    (SELECT COUNT(*) FROM "Stock") as "Total Stock Records",
    (SELECT COUNT(*) FROM "Sale" WHERE date >= CURRENT_DATE - INTERVAL '60 days') as "Sales (Last 60 Days)",
    (SELECT COUNT(*) FROM "Branch") as "Total Branches";


-- ===============================================
-- ZAPYTANIE 5: Znajdź konkretne ID dla oddziału NET
-- ===============================================
-- Cel: Potwierdzić dokładne ID dla NET
SELECT 
    id as "NET Branch ID"
FROM "Branch"
WHERE name = 'NET' OR symbol = 'NET';

-- Oczekiwany wynik: Pojedynczy wiersz z numerycznym ID
