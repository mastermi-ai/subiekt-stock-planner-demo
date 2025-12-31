export type Supplier = {
  id: string;
  name: string;
  nip?: string;
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
  branchId: string;
  date: string; // ISO string, e.g., "2025-09-01"
  quantity: number;
};

// Helper to generate random NIP
const generateNIP = () => {
  const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
  return digits;
};

// Generate 500 Mock Suppliers
export const suppliers: Supplier[] = Array.from({ length: 500 }, (_, i) => ({
  id: `sup_${i + 1}`,
  name: `Dostawca ${i + 1} - ${['Elektronika', 'Akcesoria', 'Części', 'AGD', 'RTV', 'IT'][i % 6]}`,
  nip: generateNIP()
}));

// Ensure specific suppliers used in products exist or map products to new suppliers
suppliers[0] = { id: 'sup_1', name: 'Dostawca A - Elektronika', nip: '1234567890' };
suppliers[1] = { id: 'sup_2', name: 'Dostawca B - Akcesoria', nip: '0987654321' };
suppliers[2] = { id: 'sup_3', name: 'Dostawca C - Części zamienne', nip: '1122334455' };


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
    id: 'p_3', sku: 'ELE-003', name: 'Kabel USB-C 1m', supplierId: 'sup_1',
    stockByBranch: { 'br_1': 10, 'br_2': 5, 'br_3': 5, 'br_4': 20 }
  },
  {
    id: 'p_4', sku: 'ELE-004', name: 'Ładowarka sieciowa 65W', supplierId: 'sup_1',
    stockByBranch: { 'br_1': 0, 'br_2': 0, 'br_3': 1, 'br_4': 2 }
  },
  // Supplier B
  {
    id: 'p_5', sku: 'ACC-001', name: 'Etui na telefon X', supplierId: 'sup_2',
    stockByBranch: { 'br_1': 5, 'br_2': 5, 'br_3': 5, 'br_4': 10 }
  },
  {
    id: 'p_6', sku: 'ACC-002', name: 'Szkło hartowane Y', supplierId: 'sup_2',
    stockByBranch: { 'br_1': 20, 'br_2': 15, 'br_3': 10, 'br_4': 50 }
  },
];

// Helper to generate sales
const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const today = new Date();
  const branchIds = ['br_1', 'br_2', 'br_3', 'br_4'];

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
        // Random branch
        const branchId = branchIds[Math.floor(Math.random() * branchIds.length)];
        sales.push({
          id: `sale_${product.id}_${i}`,
          productId: product.id,
          branchId,
          date: dateStr,
          quantity
        });
      }
    }
  });
  return sales;
};

export const sales: Sale[] = generateSales();
