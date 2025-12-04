import { StockPlanRow } from '@/lib/calculatePlan';

interface PlanTableProps {
    data: StockPlanRow[];
    daysOfCoverage: number;
}

export default function PlanTable({ data, daysOfCoverage }: PlanTableProps) {
    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Brak produktów dla wybranego dostawcy lub brak danych sprzedaży w wybranym okresie.
            </div>
        );
    }

    // Sort by toOrder descending
    const sortedData = [...data].sort((a, b) => b.toOrder - a.toOrder);

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LP</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nazwa produktu</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Aktualny stan</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Średnia dzienna sprzedaż</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            Potrzebne na {daysOfCoverage} dni
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Proponowane zamówienie</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, index) => (
                        <tr
                            key={row.productId}
                            className={`border-b border-gray-200 ${row.toOrder > 0 ? 'bg-yellow-50' : 'bg-white'
                                } hover:bg-gray-50 transition-colors`}
                        >
                            <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-700">{row.sku}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.name}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{row.currentStock}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{row.avgDailySales.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{row.neededForPeriod}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                {row.toOrder > 0 ? row.toOrder : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
