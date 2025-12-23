import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
    const { resource } = await params;

    try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        const count = items.length;

        console.log(`[INGEST] Received ${count} items for resource: ${resource}`);

        if (resource === 'suppliers') {
            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.supplier.upsert({
                        where: { id: item.Id ?? item.id },
                        update: { name: item.Name ?? item.name, nip: item.Nip ?? item.nip },
                        create: { id: item.Id ?? item.id, name: item.Name ?? item.name, nip: item.Nip ?? item.nip },
                    })
                )
            );
        } else if (resource === 'branches') {
            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.branch.upsert({
                        where: { id: item.Id ?? item.id },
                        update: { name: item.Name ?? item.name, symbol: item.Symbol ?? item.symbol },
                        create: { id: item.Id ?? item.id, name: item.Name ?? item.name, symbol: item.Symbol ?? item.symbol },
                    })
                )
            );
        } else if (resource === 'products') {
            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.product.upsert({
                        where: { id: item.Id ?? item.id },
                        update: { sku: item.Sku ?? item.sku, name: item.Name ?? item.name, supplierId: item.SupplierId ?? item.supplierId ?? null },
                        create: { id: item.Id ?? item.id, sku: item.Sku ?? item.sku, name: item.Name ?? item.name, supplierId: item.SupplierId ?? item.supplierId ?? null },
                    })
                )
            );
        } else if (resource === 'stocks') {
            await prisma.$transaction(
                items.map((item: any) => {
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

            await prisma.$transaction(
                Array.from(salesMap.values()).map(agg =>
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
