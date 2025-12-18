import { Branch, Product, Sale } from './mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://subiekt-planner-api.onrender.com';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || 'NEXO_PRO_CLIENT_01';
const READ_TOKEN = process.env.NEXT_PUBLIC_READ_TOKEN || 'frontend-token-secret-123';

const headers = {
    'Content-Type': 'application/json',
    'X-Client-Id': CLIENT_ID,
    'Authorization': `Bearer ${READ_TOKEN}`,
};

export async function fetchBranches(): Promise<Branch[]> {
    const res = await fetch(`${API_URL}/branches`, { headers });
    if (!res.ok) throw new Error('Failed to fetch branches');
    return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/products`, { headers });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function fetchSales(days: number = 90): Promise<Sale[]> {
    const res = await fetch(`${API_URL}/sales?days=${days}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch sales');
    return res.json();
}
