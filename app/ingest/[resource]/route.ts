import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
    const { resource } = await params;

    try {
        const body = await request.json();
        // Connector sends { clientId, syncRunId, data: [...] }
        // We need to extract the array from 'data' property if it exists
        const items = (body.data && Array.isArray(body.data))
            ? body.data
            : (Array.isArray(body) ? body : [body]);
        const count = items.length;

        console.log(`[INGEST] Received ${count} items for resource: ${resource}`);

        if (resource === 'suppliers') {
            const batchSize = 500;
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await prisma.$transaction(
                    batch.map((item: any) =>
                        prisma.supplier.upsert({
                            where: { id: item.Id ?? item.id },
                            update: { name: item.Name ?? item.name, nip: item.Nip ?? item.nip },
                            create: { id: item.Id ?? item.id, name: item.Name ?? item.name, nip: item.Nip ?? item.nip },
                        })
                    )
                );
            }
        } else if (resource === 'branches') {
            const batchSize = 500;
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await prisma.$transaction(
                    batch.map((item: any) =>
                        prisma.branch.upsert({
                            where: { id: item.Id ?? item.id },
                            update: { name: item.Name ?? item.name, symbol: item.Symbol ?? item.symbol },
                            create: { id: item.Id ?? item.id, name: item.Name ?? item.name, symbol: item.Symbol ?? item.symbol },
                        })
                    )
                );
            }
        } else if (resource === 'products') {
            const batchSize = 250;
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await prisma.$transaction(
                    batch.map((item: any) =>
                        prisma.product.upsert({
                            where: { id: item.Id ?? item.id },
                            update: { sku: item.Sku ?? item.sku, name: item.Name ?? item.name, supplierId: item.SupplierId ?? item.supplierId ?? null },
                            create: { id: item.Id ?? item.id, sku: item.Sku ?? item.sku, name: item.Name ?? item.name, supplierId: item.SupplierId ?? item.supplierId ?? null },
                        })
                    )
                );
            }
        } else if (resource === 'stocks') {
            const batchSize = 500;
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await prisma.$transaction(
                    batch.map((item: any) => {
                        const productId = item.ProductId ?? item.productId;
                        const branchId = item.BranchId ?? item.branchId;
                        const quantity = item.CurrentStock ?? item.currentStock ?? item.Quantity ?? item.quantity ?? 0;
                        return prisma.stock.upsert({
                            where: {
                                productId_branchId: { productId, branchId }
                            },
                            update: { quantity },
                            create: { productId, branchId, quantity },
                        });
                    })
                );
            }
        } else if (resource === 'sales') {
            // Aggregate in memory to be safe against duplicate lines in same batch
            const salesMap = new Map<string, { pid: number, date: Date, qty: number }>();

            for (const item of items) {
                const productId = item.ProductId ?? item.productId;
                const quantity = item.Quantity ?? item.quantity ?? 0;
                const d = new Date(item.Date ?? item.date);
                d.setUTCHours(0, 0, 0, 0);
                const dateKey = d.toISOString();
                const key = `${productId}_${dateKey}`;

                const current = salesMap.get(key) || { pid: productId, date: d, qty: 0 };
                current.qty += quantity;
                salesMap.set(key, current);
            }

            // Filter out sales for unknown products (to avoid FK errors)
            const productIds = Array.from(salesMap.values()).map(a => a.pid);

            // Validate products existence in chunks
            const validProductIds = new Set<number>();
            const idChunks = [];
            for (let i = 0; i < productIds.length; i += 2000) {
                idChunks.push(productIds.slice(i, i + 2000));
            }

            for (const chunk of idChunks) {
                const existing = await prisma.product.findMany({
                    where: { id: { in: chunk } },
                    select: { id: true }
                });
                existing.forEach(p => validProductIds.add(p.id));
            }

            const validSales = Array.from(salesMap.values()).filter(agg => validProductIds.has(agg.pid));

            console.log(`[INGEST] Sales batch: ${salesMap.size} total, ${validSales.length} valid (products exist)`);

            const batchSize = 500;
            for (let i = 0; i < validSales.length; i += batchSize) {
                const batch = validSales.slice(i, i + batchSize);
                await prisma.$transaction(
                    batch.map(agg =>
                        prisma.sale.upsert({
                            where: {
                                productId_date: {
                                    productId: agg.pid,
                                    date: agg.date
                                }
                            },
                            update: { quantity: agg.qty },
                            create: {
                                productId: agg.pid,
                                date: agg.date,
                                quantity: agg.qty
                            },
                        })
                    )
                );
            }
        }

        return NextResponse.json({
            success: true,
            resource,
            received: count
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Ingest error:', error);
        return NextResponse.json({ error: 'Ingest failed', details: errorMessage }, { status: 400 });
    }
}
