import { EnrichedPlanRow } from '@/lib/calculatePlan';
import { FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Branch } from '@/lib/mockData';

interface PdfButtonProps {
    data: EnrichedPlanRow[];
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
    const handleGeneratePdf = async () => {
        // Filter for items to order
        const itemsToOrder = data.filter(row => row.toOrder > 0);

        if (itemsToOrder.length === 0) {
            alert('Brak produktów do zamówienia. PDF nie został wygenerowany.');
            return;
        }

        try {
            // Initialize PDF
            const doc = new jsPDF();

            // Load font supporting Polish characters (Roboto)
            const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
            const response = await fetch(fontUrl);
            const buffer = await response.arrayBuffer();

            // Convert to base64
            const base64Font = btoa(
                new Uint8Array(buffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Add font to VFS and register it
            doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.setFont('Roboto');

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
                row.hasFallback ? (row.fallbackSupplierNames?.join(', ') || '') : '',
                row.currentStock,
                row.neededForPeriod,
                row.toOrder
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['LP', 'SKU', 'Nazwa produktu', 'Alternatywa', 'Aktualny stan', `Potrzebne (${daysOfCoverage} dni)`, 'Do zamówienia']],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    font: 'Roboto' // Use the custom font in header
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                    font: 'Roboto' // Use the custom font in body
                },
                columnStyles: {
                    0: { cellWidth: 10 }, // LP
                    1: { cellWidth: 25 }, // SKU
                    2: { cellWidth: 'auto' }, // Name
                    3: { cellWidth: 30 }, // Alternative
                    4: { cellWidth: 20, halign: 'right' }, // Stock
                    5: { cellWidth: 25, halign: 'right' }, // Needed
                    6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' } // To Order
                }
            });

            // Save
            const filename = `zamowienie_${supplierName.replace(/\s+/g, '_')}_${daysOfCoverage}_dni.pdf`;
            doc.save(filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Wystąpił błąd podczas generowania PDF. Sprawdź konsolę.');
        }
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
