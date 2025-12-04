import { Product, Sale } from './mockData';

export type StockPlanInput = {
    products: Product[];
    sales: Sale[];
    supplierId: string;
    daysOfCoverage: number; // X
    analysisPeriodDays: number; // Analysis period in days
};

export type StockPlanRow = {
    productId: string;
    sku: string;
    name: string;
    currentStock: number;
    avgDailySales: number;
    neededForPeriod: number; // Needed for X days
    toOrder: number; // Quantity to order
};

export function calculateStockPlan(input: StockPlanInput): StockPlanRow[] {
    const { products, sales, supplierId, daysOfCoverage, analysisPeriodDays } = input;

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

        // Avoid division by zero if analysisPeriodDays is somehow 0 (though UI should prevent this)
        const effectiveDays = Math.max(1, analysisPeriodDays);

        const avgDailySales = totalSold / effectiveDays;

        const neededForPeriod = Math.ceil(avgDailySales * daysOfCoverage);
        const toOrder = Math.max(0, neededForPeriod - product.currentStock);

        return {
            productId: product.id,
            sku: product.sku,
            name: product.name,
            currentStock: product.currentStock,
            avgDailySales: Number(avgDailySales.toFixed(2)), // Round to 2 decimal places for display consistency
            neededForPeriod,
            toOrder
        };
    });
}
