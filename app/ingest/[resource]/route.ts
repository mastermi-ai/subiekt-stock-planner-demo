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
                        where: { id: item.Id },
                        update: { name: item.Name, nip: item.Nip },
                        create: { id: item.Id, name: item.Name, nip: item.Nip },
                    })
                )
            );
        } else if (resource === 'branches') {
            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.branch.upsert({
                        where: { id: item.Id },
                        update: { name: item.Name, symbol: item.Symbol },
                        create: { id: item.Id, name: item.Name, symbol: item.Symbol },
                    })
                )
            );
        } else if (resource === 'products') {
            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.product.upsert({
                        where: { id: item.Id },
                        update: { sku: item.Sku, name: item.Name, supplierId: item.SupplierId || null },
                        create: { id: item.Id, sku: item.Sku, name: item.Name, supplierId: item.SupplierId || null },
                    })
                )
            );
        } else if (resource === 'stocks') {
            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.stock.upsert({
                        where: {
                            productId_branchId: {
                                productId: item.ProductId,
                                branchId: item.BranchId
                            }
                        },
                        update: { quantity: item.Quantity },
                        create: {
                            productId: item.ProductId,
                            branchId: item.BranchId,
                            quantity: item.Quantity
                        },
                    })
                )
            );
        } else if (resource === 'sales') {
            // Aggregate in memory to be safe against duplicate lines in same batch
            const salesMap = new Map<string, { pid: number, date: Date, qty: number }>();

            for (const item of items) {
                const d = new Date(item.Date);
                d.setUTCHours(0, 0, 0, 0);
                const dateKey = d.toISOString();
                const key = `${item.ProductId}_${dateKey}`;

                const current = salesMap.get(key) || { pid: item.ProductId, date: d, qty: 0 };
                current.qty += item.Quantity;
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
        console.error('Ingest error:', error);
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
