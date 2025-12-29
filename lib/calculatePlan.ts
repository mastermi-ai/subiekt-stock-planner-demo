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

    // 2. Calculate plan for each product
    return supplierProducts.map(product => {
        // Calculate current stock (sum of selected branches)
        const currentStock = branchIds.reduce((sum, branchId) => {
            return sum + (product.stockByBranch[branchId] || 0);
        }, 0);

        // Filter sales for this product within the analysis period
        const productSales = sales.filter(s => {
            const saleDate = new Date(s.date);
            return s.productId === product.id && saleDate >= analysisStartDate && saleDate <= end;
        });

        // Calculate total quantity sold
        const totalSold = productSales.reduce((sum, s) => sum + s.quantity, 0);

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
