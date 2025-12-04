export type Supplier = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  supplierId: string;
  currentStock: number;
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

// Mock Products
export const products: Product[] = [
  // Supplier A
  { id: 'p_1', sku: 'ELE-001', name: 'Słuchawki bezprzewodowe Pro', supplierId: 'sup_1', currentStock: 15 },
  { id: 'p_2', sku: 'ELE-002', name: 'Powerbank 20000mAh', supplierId: 'sup_1', currentStock: 8 },
  { id: 'p_3', sku: 'ELE-003', name: 'Kabel USB-C 2m', supplierId: 'sup_1', currentStock: 120 },
  { id: 'p_4', sku: 'ELE-004', name: 'Ładowarka sieciowa 65W', supplierId: 'sup_1', currentStock: 5 },
  { id: 'p_5', sku: 'ELE-005', name: 'Głośnik Bluetooth Mini', supplierId: 'sup_1', currentStock: 30 },
  
  // Supplier B
  { id: 'p_6', sku: 'ACC-001', name: 'Etui iPhone 15', supplierId: 'sup_2', currentStock: 50 },
  { id: 'p_7', sku: 'ACC-002', name: 'Szkło hartowane iPhone 15', supplierId: 'sup_2', currentStock: 200 },
  { id: 'p_8', sku: 'ACC-003', name: 'Uchwyt samochodowy', supplierId: 'sup_2', currentStock: 12 },
  { id: 'p_9', sku: 'ACC-004', name: 'Podstawka pod laptopa', supplierId: 'sup_2', currentStock: 3 },
  { id: 'p_10', sku: 'ACC-005', name: 'Mysz bezprzewodowa', supplierId: 'sup_2', currentStock: 25 },

  // Supplier C
  { id: 'p_11', sku: 'PRT-001', name: 'Bateria AA (4-pack)', supplierId: 'sup_3', currentStock: 500 },
  { id: 'p_12', sku: 'PRT-002', name: 'Bateria AAA (4-pack)', supplierId: 'sup_3', currentStock: 450 },
  { id: 'p_13', sku: 'PRT-003', name: 'Śrubokręt precyzyjny', supplierId: 'sup_3', currentStock: 40 },
  { id: 'p_14', sku: 'PRT-004', name: 'Taśma izolacyjna', supplierId: 'sup_3', currentStock: 100 },
  { id: 'p_15', sku: 'PRT-005', name: 'Zestaw naprawczy LCD', supplierId: 'sup_3', currentStock: 2 },
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
