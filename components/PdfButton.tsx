import { StockPlanRow } from '@/lib/calculatePlan';
import { FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Branch } from '@/lib/mockData';

interface PdfButtonProps {
    data: StockPlanRow[];
    supplierName: string;
    selectedBranches: Branch[];
    daysOfCoverage: number;
    analysisPeriodDays: number;
}

export default function PdfButton({
    data,
    supplierName,
    selectedBranches,
    daysOfCoverage,
    analysisPeriodDays
}: PdfButtonProps) {
    const handleGeneratePdf = () => {
        // Filter for items to order
        const itemsToOrder = data.filter(row => row.toOrder > 0);

        if (itemsToOrder.length === 0) {
            alert('Brak produktów do zamówienia. PDF nie został wygenerowany.');
            return;
        }

        // Initialize PDF
        const doc = new jsPDF();

        // Add Polish font support (using standard font for now, but handling encoding via text)
        // Note: Standard fonts might not support all Polish chars perfectly without custom font loading
        // For this demo, we'll rely on standard encoding which usually works fine for basic chars

        // Header
        doc.setFontSize(18);
        doc.text(`Zamówienie - ${supplierName}`, 14, 20);

        doc.setFontSize(11);
        doc.text(`Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}`, 14, 30);

        const branchNames = selectedBranches.map(b => b.name).join(', ');
        doc.text(`Oddziały: ${branchNames}`, 14, 36);

        doc.text(`Planowany zapas: ${daysOfCoverage} dni`, 14, 42);
        doc.text(`Okres analizy: ${analysisPeriodDays} dni`, 14, 48);

        // Table
        const tableData = itemsToOrder.map((row, index) => [
            index + 1,
            row.sku,
            row.name,
            row.currentStock,
            row.neededForPeriod,
            row.toOrder
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['LP', 'SKU', 'Nazwa produktu', 'Aktualny stan', `Potrzebne (${daysOfCoverage} dni)`, 'Do zamówienia']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 15 }, // LP
                1: { cellWidth: 30 }, // SKU
                2: { cellWidth: 'auto' }, // Name
                3: { cellWidth: 25, halign: 'right' }, // Stock
                4: { cellWidth: 30, halign: 'right' }, // Needed
                5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' } // To Order
            }
        });

        // Save
        const filename = `zamowienie_${supplierName.replace(/\s+/g, '_')}_${daysOfCoverage}_dni.pdf`;
        doc.save(filename);
    };

    const itemsToOrderCount = data.filter(row => row.toOrder > 0).length;

    return (
        <button
            onClick={handleGeneratePdf}
            disabled={itemsToOrderCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
            <FileText size={18} />
            Generuj PDF zamówienia
        </button>
    );
}
