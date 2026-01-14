import { StockPlanRow } from '@/lib/calculatePlan';
import { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

interface PlanTableProps {
    data: StockPlanRow[];
    daysOfCoverage: number;
}

type SortOption = 'order_desc' | 'name_asc' | 'name_desc' | 'sku_asc' | 'sku_desc';

export default function PlanTable({ data, daysOfCoverage }: PlanTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('order_desc');
    const [showOnlyToOrder, setShowOnlyToOrder] = useState(false);

    // Filter and sort data
    const processedData = useMemo(() => {
        let result = [...data];

        // Filter by search term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(
                row =>
                    row.name.toLowerCase().includes(lowerTerm) ||
                    row.sku.toLowerCase().includes(lowerTerm)
            );
        }

        // Filter only to order
        if (showOnlyToOrder) {
            result = result.filter(row => row.toOrder > 0);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'order_desc':
                    return b.toOrder - a.toOrder;
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'sku_asc':
                    return a.sku.localeCompare(b.sku);
                case 'sku_desc':
                    return b.sku.localeCompare(a.sku);
                default:
                    return 0;
            }
        });

        return result;
    }, [data, searchTerm, sortBy, showOnlyToOrder]);

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Brak produktów dla wybranego dostawcy lub brak danych sprzedaży w wybranym okresie.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Szukaj po nazwie lub SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    {/* Sort */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ArrowUpDown size={18} className="text-gray-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="order_desc">Proponowane zamówienie (malejąco)</option>
                            <option value="name_asc">Nazwa (A-Z)</option>
                            <option value="name_desc">Nazwa (Z-A)</option>
                            <option value="sku_asc">SKU (A-Z)</option>
                            <option value="sku_desc">SKU (Z-A)</option>
                        </select>
                    </div>

                    {/* Only To Order Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlyToOrder}
                            onChange={(e) => setShowOnlyToOrder(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 whitespace-nowrap">Tylko do zamówienia</span>
                    </label>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="flex gap-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
                <div>
                    Do zamówienia: <span className="font-bold">{processedData.filter(r => r.toOrder > 0).length}</span> pozycji
                </div>
                <div>
                    Łączna ilość sztuk: <span className="font-bold">{processedData.reduce((sum, r) => sum + Math.max(0, r.toOrder), 0)}</span> szt.
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LP</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nazwa produktu</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Aktualny stan</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Sprzedaż (okres)</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Średnia dzienna</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                Potrzebne na {daysOfCoverage} dni
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Proponowane zamówienie</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.length > 0 ? (
                            processedData.map((row, index) => {
                                // Determine row color
                                let rowClass = 'bg-white';
                                if (row.currentStock === 0 && row.toOrder > 0) {
                                    rowClass = 'bg-red-50 hover:bg-red-100'; // CRITICAL: Out of stock
                                } else if (row.toOrder > 0) {
                                    rowClass = 'bg-yellow-50 hover:bg-yellow-100'; // WARNING: Low stock
                                } else {
                                    rowClass = 'hover:bg-gray-50'; // OK
                                }

                                return (
                                    <tr
                                        key={row.productId}
                                        className={`border-b border-gray-200 last:border-0 transition-colors ${rowClass}`}
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{row.sku}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{row.name}</td>
                                        <td className={`px-4 py-3 text-sm text-right ${row.currentStock === 0 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                                            {row.currentStock}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">{row.totalSold}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700">{row.avgDailySales.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700">{row.neededForPeriod}</td>
                                        <td className={`px-4 py-3 text-sm text-right font-semibold ${row.toOrder > 0 ? 'text-blue-600' : row.toOrder < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                            {row.toOrder}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    Brak wyników dla podanych kryteriów wyszukiwania.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-sm text-gray-500 text-right">
                Wyświetlono: {processedData.length} z {data.length} pozycji
            </div>
        </div>
    );
}
