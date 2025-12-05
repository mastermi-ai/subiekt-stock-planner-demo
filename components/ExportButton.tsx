import { EnrichedPlanRow } from '@/lib/calculatePlan';
import { Download } from 'lucide-react';

interface ExportButtonProps {
    data: EnrichedPlanRow[];
    supplierName: string;
    daysOfCoverage: number;
    analysisPeriodDays: number;
}

export default function ExportButton({
    data,
    supplierName,
    daysOfCoverage,
    analysisPeriodDays
}: ExportButtonProps) {
    const handleExportCSV = () => {
        if (data.length === 0) return;

        // Sort data by toOrder descending (same as table)
        const sortedData = [...data].sort((a, b) => b.toOrder - a.toOrder);

        // Create CSV header
        const headers = [
            'LP',
            'SKU',
            'Nazwa produktu',
            'Alternatywa',
            'Aktualny stan',
            'Średnia dzienna sprzedaż',
            `Potrzebne na ${daysOfCoverage} dni`,
            'Proponowane zamówienie',
            'Okres analizy (dni)'
        ];

        // Create CSV rows
        const rows = sortedData.map((row, index) => [
            index + 1,
            row.sku,
            `"${row.name}"`, // Quote to handle commas in product names
            row.hasFallback ? `"${row.fallbackSupplierNames?.join(', ')}"` : '',
            row.currentStock,
            row.avgDailySales.toFixed(2),
            row.neededForPeriod,
            row.toOrder,
            analysisPeriodDays
        ]);

        // Combine header and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Add BOM for proper Polish characters encoding in Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan_zamowien_${supplierName.replace(/\s+/g, '_')}_${daysOfCoverage}_dni.csv`;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
            <Download size={18} />
            Eksport do CSV
        </button>
    );
}
