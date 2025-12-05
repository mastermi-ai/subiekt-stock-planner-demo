export type Supplier = {
  id: string;
  name: string;
};

export type Branch = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  supplierId: string;
  stockByBranch: Record<string, number>; // key = branchId, value = stock
};

export type Sale = {
  id: string;
  productId: string;
  date: string; // ISO string, e.g., "2025-09-01"
  quantity: number;
};

// Mock Suppliers
export const suppliers: Supplier[] = [
  { id: 'sup_1', name: 'Dostawca A - Elektronika' },
  { id: 'sup_2', name: 'Dostawca B - Akcesoria' },
  { id: 'sup_3', name: 'Dostawca C - Części zamienne' },
];

// Mock Branches
export const branches: Branch[] = [
  { id: 'br_1', name: 'Oddział Warszawa' },
  { id: 'br_2', name: 'Oddział Kraków' },
  { id: 'br_3', name: 'Oddział Gdańsk' },
  { id: 'br_4', name: 'Magazyn Centralny' },
];

// Mock Products
export const products: Product[] = [
  // Supplier A
  {
    id: 'p_1', sku: 'ELE-001', name: 'Słuchawki bezprzewodowe Pro', supplierId: 'sup_1',
    stockByBranch: { 'br_1': 5, 'br_2': 3, 'br_3': 2, 'br_4': 5 }
  },
  {
    id: 'p_2', sku: 'ELE-002', name: 'Powerbank 20000mAh', supplierId: 'sup_1',
    stockByBranch: { 'br_1': 2, 'br_2': 1, 'br_3': 0, 'br_4': 5 }
  },
  {
    id: 'p_3', sku: 'ELE-003', name: 'Kabel USB-C 2m', supplierId: 'sup_1',
    stockByBranch: { 'br_1': 40, 'br_2': 30, 'br_3': 20, 'br_4': 30 }
  },
  {
    id: 'p_4', sku: 'ELE-004', name: 'Ładowarka sieciowa 65W', supplierId: 'sup_1',
    stockByBranch: { 'br_1': 1, 'br_2': 1, 'br_3': 0, 'br_4': 3 }
  },
  {
    id: 'p_5', sku: 'ELE-005', name: 'Głośnik Bluetooth Mini', supplierId: 'sup_1',
    stockByBranch: { 'br_1': 10, 'br_2': 5, 'br_3': 5, 'br_4': 10 }
  },

  // Supplier B
  {
    id: 'p_6', sku: 'ACC-001', name: 'Etui iPhone 15', supplierId: 'sup_2',
    stockByBranch: { 'br_1': 15, 'br_2': 10, 'br_3': 5, 'br_4': 20 }
  },
  {
    id: 'p_7', sku: 'ACC-002', name: 'Szkło hartowane iPhone 15', supplierId: 'sup_2',
    stockByBranch: { 'br_1': 50, 'br_2': 40, 'br_3': 30, 'br_4': 80 }
  },
  {
    id: 'p_8', sku: 'ACC-003', name: 'Uchwyt samochodowy', supplierId: 'sup_2',
    stockByBranch: { 'br_1': 3, 'br_2': 2, 'br_3': 2, 'br_4': 5 }
  },
  {
    id: 'p_9', sku: 'ACC-004', name: 'Podstawka pod laptopa', supplierId: 'sup_2',
    stockByBranch: { 'br_1': 1, 'br_2': 0, 'br_3': 0, 'br_4': 2 }
  },
  {
    id: 'p_10', sku: 'ACC-005', name: 'Mysz bezprzewodowa', supplierId: 'sup_2',
    stockByBranch: { 'br_1': 8, 'br_2': 5, 'br_3': 2, 'br_4': 10 }
  },

  // Supplier C
  {
    id: 'p_11', sku: 'PRT-001', name: 'Bateria AA (4-pack)', supplierId: 'sup_3',
    stockByBranch: { 'br_1': 100, 'br_2': 100, 'br_3': 100, 'br_4': 200 }
  },
  {
    id: 'p_12', sku: 'PRT-002', name: 'Bateria AAA (4-pack)', supplierId: 'sup_3',
    stockByBranch: { 'br_1': 100, 'br_2': 100, 'br_3': 50, 'br_4': 200 }
  },
  {
    id: 'p_13', sku: 'PRT-003', name: 'Śrubokręt precyzyjny', supplierId: 'sup_3',
    stockByBranch: { 'br_1': 10, 'br_2': 10, 'br_3': 5, 'br_4': 15 }
  },
  {
    id: 'p_14', sku: 'PRT-004', name: 'Taśma izolacyjna', supplierId: 'sup_3',
    stockByBranch: { 'br_1': 30, 'br_2': 20, 'br_3': 20, 'br_4': 30 }
  },
  {
    id: 'p_15', sku: 'PRT-005', name: 'Zestaw naprawczy LCD', supplierId: 'sup_3',
    stockByBranch: { 'br_1': 0, 'br_2': 0, 'br_3': 0, 'br_4': 2 }
  },
];

// Helper to generate sales
const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const today = new Date();

  products.forEach(product => {
    // Generate sales for last 120 days
    for (let i = 0; i < 120; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Random chance of sale (70% chance of no sale for some variance)
      if (Math.random() > 0.7) {
        // Random quantity 1-20
        const quantity = Math.floor(Math.random() * 20) + 1;
        sales.push({
          id: `sale_${product.id}_${i}`,
          productId: product.id,
          date: dateStr,
          quantity
        });
      }
    }
  });
  return sales;
};

export const sales: Sale[] = generateSales();

export type SupplierOffer = {
  productId: string;
  supplierId: string;
  priority: 1 | 2 | 3; // 1 = primary, 2+ = fallback
  isFallback: boolean;
  note?: string;
};

// Mock Supplier Offers
// Scenario: Some products from Supplier A have fallback to Supplier B or C
export const supplierOffers: SupplierOffer[] = [
  // Product 1 (Supplier A) -> Fallback Supplier B
  { productId: 'p_1', supplierId: 'sup_1', priority: 1, isFallback: false },
  { productId: 'p_1', supplierId: 'sup_2', priority: 2, isFallback: true, note: 'Droższy, używać gdy brak u A' },

  // Product 2 (Supplier A) -> Fallback Supplier C
  { productId: 'p_2', supplierId: 'sup_1', priority: 1, isFallback: false },
  { productId: 'p_2', supplierId: 'sup_3', priority: 2, isFallback: true },

  // Product 3 (Supplier A) -> No fallback
  { productId: 'p_3', supplierId: 'sup_1', priority: 1, isFallback: false },

  // Product 6 (Supplier B) -> Fallback Supplier A
  { productId: 'p_6', supplierId: 'sup_2', priority: 1, isFallback: false },
  { productId: 'p_6', supplierId: 'sup_1', priority: 2, isFallback: true, note: 'Dłuższy czas dostawy' },

  // Product 11 (Supplier C) -> Fallback Supplier A
  { productId: 'p_11', supplierId: 'sup_3', priority: 1, isFallback: false },
  { productId: 'p_11', supplierId: 'sup_1', priority: 2, isFallback: true },
];
