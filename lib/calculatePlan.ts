import { Product, Sale } from './mockData';

export type StockPlanInput = {
    products: Product[];
    sales: Sale[];
    supplierIds: string[]; // Changed from single supplierId
    daysOfCoverage: number; // X
    analysisStartDate: Date; // Start date of analysis
    analysisEndDate?: Date; // Optional end date (defaults to now)
    branchIds: string[]; // Selected branches
};

export type StockPlanRow = {
    productId: string;
    sku: string;
    name: string;
    currentStock: number;
    avgDailySales: number;
    neededForPeriod: number;
    toOrder: number;
    supplierId: string; // Added for reference
};

export function calculateStockPlan({
    products,
    sales,
    supplierIds,
    daysOfCoverage,
    analysisStartDate,
    analysisEndDate,
    branchIds
}: StockPlanInput): StockPlanRow[] {
    // 1. Filter products by selected suppliers
    // If supplierIds is empty, we might return empty or specific behavior, but here we assume filtered.
    const supplierProducts = products.filter(p => p.supplierId && supplierIds.includes(p.supplierId));

    // Calculate actual number of days in the analysis period for averaging
    const end = analysisEndDate || new Date();
    // Ensure we count inclusive or exclusive properly. 
    // Time difference in milliseconds
    const timeDiff = end.getTime() - analysisStartDate.getTime();
    // Convert to days, minimum 1 to avoid division by zero
    const analysisDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    // Create a Set of product IDs for selected suppliers (for O(1) lookup)
    const supplierProductIds = new Set(supplierProducts.map(p => p.id));

    // 2. Pre-filter and group sales by productId
    // OPTIMIZATION: Only process sales for products from selected suppliers
    const salesByProduct = new Map<string, Sale[]>();
    sales.forEach(s => {
        // Skip sales not from selected branches
        if (!branchIds.includes(s.branchId)) return;

        // Skip sales for products not from selected suppliers (major optimization)
        if (!supplierProductIds.has(s.productId)) return;

        const existing = salesByProduct.get(s.productId) || [];
        existing.push(s);
        salesByProduct.set(s.productId, existing);
    });

    // 2. Calculate plan for each product
    return supplierProducts.map(product => {
        // Calculate current stock and reserved (sum of selected branches)
        let totalStock = 0;
        let totalReserved = 0;

        branchIds.forEach(branchId => {
            const stock = product.stockByBranch[branchId];
            if (stock) {
                totalStock += stock.quantity;
                totalReserved += stock.reserved;
            }
        });

        // Available stock = total - reserved
        const currentStock = Math.max(0, totalStock - totalReserved);

        // Get pre-filtered sales for this product
        const productAllSales = salesByProduct.get(product.id) || [];

        // Filter by date (Branch filtering is already done during grouping)
        const totalSold = productAllSales.reduce((sum, s) => {
            const saleDate = new Date(s.date);
            if (saleDate >= analysisStartDate && saleDate <= end) {
                return sum + s.quantity;
            }
            return sum;
        }, 0);

        // Calculate average daily sales
        const avgDailySales = totalSold / analysisDays;

        // Calculate needed quantity for coverage period
        const neededForPeriod = Math.ceil(avgDailySales * daysOfCoverage);

        // Calculate quantity to order
        const toOrder = Math.max(0, neededForPeriod - currentStock);

        return {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            currentStock,
            avgDailySales,
            neededForPeriod,
            toOrder,
            supplierId: product.supplierId || ''
        };
    });
}
