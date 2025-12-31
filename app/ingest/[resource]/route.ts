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
            // Pre-fetch all supplier IDs to validate foreign keys
            const allSuppliers = await prisma.supplier.findMany({ select: { id: true } });
            const validSupplierIds = new Set(allSuppliers.map(s => s.id));

            const batchSize = 250;
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);

                // Sanitize batch: remove items without ID/Name/SKU, fix invalid SupplierIds
                const validBatch = batch.filter((item: any) => {
                    const id = item.Id ?? item.id;
                    const name = item.Name ?? item.name;
                    const sku = item.Sku ?? item.sku;

                    if (!id || !name || !sku) {
                        console.warn(`[INGEST] Skipping invalid product (missing required fields):`, item);
                        return false;
                    }
                    return true;
                }).map((item: any) => {
                    const supplierId = item.SupplierId ?? item.supplierId;
                    // If supplierId provided but not in DB, set to null to avoid FK error
                    const finalSupplierId = (supplierId && validSupplierIds.has(supplierId)) ? supplierId : null;

                    return {
                        ...item,
                        SupplierId: finalSupplierId,
                        supplierId: finalSupplierId
                    };
                });

                if (validBatch.length > 0) {
                    await prisma.$transaction(
                        validBatch.map((item: any) =>
                            prisma.product.upsert({
                                where: { id: item.Id ?? item.id },
                                update: { sku: item.Sku ?? item.sku, name: item.Name ?? item.name, supplierId: item.SupplierId ?? item.supplierId ?? null },
                                create: { id: item.Id ?? item.id, sku: item.Sku ?? item.sku, name: item.Name ?? item.name, supplierId: item.SupplierId ?? item.supplierId ?? null },
                            })
                        )
                    );
                }
            }
        } else if (resource === 'stocks') {
            // Pre-fetch valid IDs to avoid FK errors
            const allProducts = await prisma.product.findMany({ select: { id: true } });
            const allBranches = await prisma.branch.findMany({ select: { id: true } });

            const validProductIds = new Set(allProducts.map(p => p.id));
            const validBranchIds = new Set(allBranches.map(b => b.id));

            const batchSize = 500;
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);

                const validBatch = batch.filter((item: any) => {
                    const productId = item.ProductId ?? item.productId;
                    const branchId = item.BranchId ?? item.branchId;

                    if (!validProductIds.has(productId)) {
                        // console.warn(`[INGEST] Skipping stock for unknown product ID: ${productId}`);
                        return false;
                    }
                    if (!validBranchIds.has(branchId)) {
                        // console.warn(`[INGEST] Skipping stock for unknown branch ID: ${branchId}`);
                        return false;
                    }
                    return true;
                });

                if (validBatch.length > 0) {
                    await prisma.$transaction(
                        validBatch.map((item: any) => {
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
            }
        } else if (resource === 'sales') {
            // Aggregate in memory: key = productId_branchId_date
            const salesMap = new Map<string, { pid: number, bid: number, date: Date, qty: number }>();

            for (const item of items) {
                const productId = item.ProductId ?? item.productId;
                const branchId = item.BranchId ?? item.branchId;
                const quantity = item.Quantity ?? item.quantity ?? 0;
                const d = new Date(item.Date ?? item.date);
                d.setUTCHours(0, 0, 0, 0);
                const dateKey = d.toISOString();
                const key = `${productId}_${branchId}_${dateKey}`;

                const current = salesMap.get(key) || { pid: productId, bid: branchId, date: d, qty: 0 };
                current.qty += quantity;
                salesMap.set(key, current);
            }

            // Pre-fetch valid product and branch IDs
            const allProducts = await prisma.product.findMany({ select: { id: true } });
            const allBranches = await prisma.branch.findMany({ select: { id: true } });
            const validProductIds = new Set(allProducts.map(p => p.id));
            const validBranchIds = new Set(allBranches.map(b => b.id));

            const validSales = Array.from(salesMap.values()).filter(agg =>
                validProductIds.has(agg.pid) && validBranchIds.has(agg.bid)
            );

            console.log(`[INGEST] Sales batch: ${salesMap.size} total, ${validSales.length} valid (products & branches exist)`);

            const batchSize = 500;
            for (let i = 0; i < validSales.length; i += batchSize) {
                const batch = validSales.slice(i, i + batchSize);
                await prisma.$transaction(
                    batch.map(agg =>
                        prisma.sale.upsert({
                            where: {
                                productId_branchId_date: {
                                    productId: agg.pid,
                                    branchId: agg.bid,
                                    date: agg.date
                                }
                            },
                            update: { quantity: agg.qty },
                            create: {
                                productId: agg.pid,
                                branchId: agg.bid,
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
