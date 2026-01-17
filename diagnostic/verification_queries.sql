-- ===============================================
-- VERIFICATION QUERIES - Client 1 Data Sync
-- Date: 2026-01-10
-- Sync Run: 0316d6df-ba21-4979-af63-26093946d702
-- ===============================================

-- 1. RECORD COUNTS
-- ===============================================

-- Total records in each table
SELECT 'Sales' as table_name, COUNT(*) as record_count FROM "Sale"
UNION ALL
SELECT 'Stocks', COUNT(*) FROM "Stock"
UNION ALL
SELECT 'Products', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Suppliers', COUNT(*) FROM "Supplier"
UNION ALL
SELECT 'Branches', COUNT(*) FROM "Branch"
ORDER BY table_name;

-- Expected:
-- Sales: ~197,000 (450 days × avg sales)
-- Stocks: ~4,000 products × 14 branches = ~56,000
-- Products: ~4,000
-- Suppliers: 129
-- Branches: ~14


-- 2. STOCK DISTRIBUTION BY BRANCH
-- ===============================================

SELECT 
    b.symbol,
    b.name,
    b.id as branch_id,
    COUNT(s.id) as product_count,
    SUM(s.quantity) as total_quantity,
    SUM(s.reserved) as total_reserved,
    SUM(s.quantity - s.reserved) as available
FROM "Branch" b
LEFT JOIN "Stock" s ON s."branchId" = b.id
GROUP BY b.id, b.symbol, b.name
ORDER BY b.id;

-- Verify: NET (100002) should have > 0 products


-- 3. TEST SKU: 113S3_ocieplane_42 for NET
-- ===============================================

SELECT 
    p.sku,
    p.name,
    b.symbol as branch,
    COUNT(s.id) as sale_records,
    SUM(s.quantity) as total_sold,
    MIN(s.date) as first_sale,
    MAX(s.date) as last_sale,
    ROUND(SUM(s.quantity)::numeric / 
          EXTRACT(DAY FROM MAX(s.date) - MIN(s.date) + INTERVAL '1 day'), 2) as avg_per_day
FROM "Sale" s
JOIN "Product" p ON s."productId" = p.id
JOIN "Branch" b ON s."branchId" = b.id
WHERE p.sku = '113S3_ocieplane_42'
  AND b.id = 100002  -- NET
  AND s.date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY p.sku, p.name, b.symbol;

-- Expected:
-- sale_records: ~100-120
-- total_sold: ~107-111
-- avg_per_day: ~1.78-1.85


-- 4. STOCK FOR TEST SKU
-- ===============================================

SELECT 
    p.sku,
    p.name,
    b.symbol as branch,
    s.quantity as physical_stock,
    s.reserved,
    (s.quantity - s.reserved) as available
FROM "Stock" s
JOIN "Product" p ON s."productId" = p.id
JOIN "Branch" b ON s."branchId" = b.id
WHERE p.sku = '113S3_ocieplane_42'
  AND b.id = 100002;  -- NET

-- Verify: quantity > 0 (not zero!)


-- 5. RESERVED STOCK STATISTICS
-- ===============================================

SELECT 
    COUNT(*) as total_stocks,
    COUNT(CASE WHEN reserved > 0 THEN 1 END) as stocks_with_reservations,
    ROUND(100.0 * COUNT(CASE WHEN reserved > 0 THEN 1 END) / COUNT(*), 2) as pct_with_reservations,
    ROUND(SUM(quantity)::numeric, 2) as total_physical,
    ROUND(SUM(reserved)::numeric, 2) as total_reserved,
    ROUND(SUM(quantity - reserved)::numeric, 2) as total_available
FROM "Stock";


-- 6. SALES DATE RANGE VERIFICATION
-- ===============================================

SELECT 
    MIN(date) as oldest_sale,
    MAX(date) as newest_sale,
    EXTRACT(DAY FROM MAX(date) - MIN(date)) as days_covered,
    COUNT(DISTINCT date) as unique_dates,
    COUNT(*) as total_records
FROM "Sale";

-- Expected: days_covered ≈ 450


-- 7. TOP 10 PRODUCTS BY SALES (Last 60 days)
-- ===============================================

SELECT 
    p.sku,
    p.name,
    s2.name as supplier,
    COUNT(s.id) as transactions,
    ROUND(SUM(s.quantity)::numeric, 2) as total_sold
FROM "Sale" s
JOIN "Product" p ON s."productId" = p.id
LEFT JOIN "Supplier" s2 ON p."supplierId" = s2.id
WHERE s.date >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY p.id, p.sku, p.name, s2.name
ORDER BY total_sold DESC
LIMIT 10;


-- 8. BRANCHES WITH ZERO STOCKS (Should be empty!)
-- ===============================================

SELECT 
    b.id,
    b.symbol,
    b.name,
    COUNT(s.id) as stock_count
FROM "Branch" b
LEFT JOIN "Stock" s ON s."branchId" = b.id
GROUP BY b.id, b.symbol, b.name
HAVING COUNT(s.id) = 0;

-- Expected: 0 rows (all branches should have stocks)


-- 9. PRODUCTS WITHOUT SUPPLIER
-- ===============================================

SELECT 
    COUNT(*) as products_without_supplier,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM "Product"), 2) as percentage
FROM "Product"
WHERE "supplierId" IS NULL;


-- 10. VALIDATION SUMMARY
-- ===============================================

WITH stats AS (
    SELECT 
        (SELECT COUNT(*) FROM "Sale") as sales,
        (SELECT COUNT(*) FROM "Stock") as stocks,
        (SELECT COUNT(*) FROM "Product") as products,
        (SELECT COUNT(DISTINCT "branchId") FROM "Stock") as branches_with_stock,
        (SELECT COUNT(*) FROM "Branch") as total_branches,
        (SELECT COUNT(*) FROM "Supplier") as suppliers
)
SELECT 
    sales,
    stocks,
    products,
    suppliers,
    total_branches,
    branches_with_stock,
    CASE 
        WHEN branches_with_stock = total_branches THEN '✅ OK'
        ELSE '❌ FAIL'
    END as branch_coverage,
    CASE 
        WHEN sales > 150000 THEN '✅ OK'
        ELSE '⚠️ LOW'
    END as sales_check
FROM stats;
