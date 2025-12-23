import { Branch, Product, Sale, Supplier } from './mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchBranches(): Promise<Branch[]> {
    const res = await fetch(`${API_URL}/api/branches`);
    if (!res.ok) throw new Error('Failed to fetch branches');
    return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function fetchSales(days: number = 90): Promise<Sale[]> {
    const res = await fetch(`${API_URL}/api/sales?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch sales');
    return res.json();
}

export async function fetchSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${API_URL}/api/suppliers`);
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
}
