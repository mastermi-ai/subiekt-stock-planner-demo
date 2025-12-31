import { StockPlanRow } from '@/lib/calculatePlan';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
    data: StockPlanRow[];
    supplierName: string;
    daysOfCoverage: number;
    analysisPeriodLabel: string;
}

export default function ExportButton({ data, supplierName, daysOfCoverage, analysisPeriodLabel }: ExportButtonProps) {
    const handleExportCSV = () => {
        if (data.length === 0) return;

        // Prepare data for CSV
        const csvData = data.map((row, index) => ({
            'LP': index + 1,
            'SKU': row.sku,
            'Nazwa produktu': row.name,
            'Aktualny stan': row.currentStock,
            'Średnia dzienna sprzedaż': row.avgDailySales.toFixed(2),
            [`Potrzebne na ${daysOfCoverage} dni`]: row.neededForPeriod,
            'Proponowane zamówienie': row.toOrder
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(csvData);

        // Create CSV content
        const csvContent = XLSX.utils.sheet_to_csv(ws);

        // Add BOM for Excel to recognize UTF-8
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

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
