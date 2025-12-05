import { Product, Sale } from './mockData';

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
    currentStock: number;
    avgDailySales: number;
    neededForPeriod: number;
    toOrder: number;
};

export function calculateStockPlan({
    products,
    sales,
    supplierId,
    daysOfCoverage,
    analysisPeriodDays,
    branchIds
}: StockPlanInput): StockPlanRow[] {
    // 1. Filter products by supplier
    const supplierProducts = products.filter(p => p.supplierId === supplierId);

    // 2. Calculate plan for each product
    return supplierProducts.map(product => {
        // Calculate current stock (sum of selected branches)
        const currentStock = branchIds.reduce((sum, branchId) => {
            return sum + (product.stockByBranch[branchId] || 0);
        }, 0);

        // Filter sales for this product within the analysis period
        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - analysisPeriodDays);

        const productSales = sales.filter(s => {
            const saleDate = new Date(s.date);
            return s.productId === product.id && saleDate >= cutoffDate;
        });

        // Calculate total quantity sold
        const totalSold = productSales.reduce((sum, s) => sum + s.quantity, 0);

        // Calculate average daily sales
        // Prevent division by zero if analysisPeriodDays is 0 (though it shouldn't be)
        const avgDailySales = analysisPeriodDays > 0 ? totalSold / analysisPeriodDays : 0;

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
            toOrder
        };
    });
}
