import { Product, Sale, SupplierOffer, Supplier } from './mockData';

export type StockPlanInput = {
    products: Product[];
    sales: Sale[];
    supplierId: string;
    daysOfCoverage: number; // X
    analysisPeriodDays: number; // Analysis period in days
    branchIds: string[]; // Selected branches
};

export type StockPlanRow = {
    productId: string;
    sku: string;
    name: string;
    currentStock: number; // Sum of stock from selected branches
    avgDailySales: number;
    neededForPeriod: number; // Needed for X days
    toOrder: number; // Quantity to order
};

export function calculateStockPlan(input: StockPlanInput): StockPlanRow[] {
    const { products, sales, supplierId, daysOfCoverage, analysisPeriodDays, branchIds } = input;

    // 1. Filter products by supplier
    const supplierProducts = products.filter(p => p.supplierId === supplierId);

    // Calculate cutoff date for analysis
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - analysisPeriodDays);

    return supplierProducts.map(product => {
        // 2. Filter sales for this product within the analysis period
        const productSales = sales.filter(sale => {
            if (sale.productId !== product.id) return false;
            const saleDate = new Date(sale.date);
            return saleDate >= cutoffDate && saleDate <= today;
        });

        // 3. Calculate metrics
        const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);

        // Avoid division by zero
        const effectiveDays = Math.max(1, analysisPeriodDays);

        const avgDailySales = totalSold / effectiveDays;

        // Calculate current stock based on selected branches
        const currentStock = branchIds.reduce((sum, branchId) => {
            return sum + (product.stockByBranch[branchId] || 0);
        }, 0);

        const neededForPeriod = Math.ceil(avgDailySales * daysOfCoverage);
        const toOrder = Math.max(0, neededForPeriod - currentStock);

        return {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            currentStock,
            avgDailySales: Number(avgDailySales.toFixed(2)),
            neededForPeriod,
            toOrder
        };
    });
}

export type EnrichedPlanRow = StockPlanRow & {
    primarySupplierId?: string;
    fallbackSupplierIds?: string[];
    fallbackSupplierNames?: string[]; // Helper for display
    hasFallback: boolean;
    fallbackNote?: string;
};

export function enrichWithSupplierOffers(plan: StockPlanRow[], offers: SupplierOffer[], suppliers: Supplier[]): EnrichedPlanRow[] {
    return plan.map(row => {
        const productOffers = offers.filter(o => o.productId === row.productId);

        // Find primary (priority 1)
        const primary = productOffers.find(o => o.priority === 1);

        // Find fallbacks (priority > 1, isFallback = true)
        const fallbacks = productOffers
            .filter(o => o.isFallback)
            .sort((a, b) => a.priority - b.priority);

        const fallbackSupplierIds = fallbacks.map(f => f.supplierId);

        // Map IDs to Names for easier display
        const fallbackSupplierNames = fallbackSupplierIds.map(id => {
            const sup = suppliers.find(s => s.id === id);
            return sup ? sup.name : id; // Use the provided suppliers array
        });

        return {
            ...row,
            primarySupplierId: primary?.supplierId,
            fallbackSupplierIds,
            fallbackSupplierNames,
            hasFallback: fallbacks.length > 0,
            fallbackNote: fallbacks[0]?.note // Take note from the first fallback
        };
    });
}
