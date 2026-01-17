'use client';

import { useState, useEffect, useMemo } from 'react';
import { calculateStockPlan, StockPlanRow } from '@/lib/calculatePlan';
import PlanForm, { DatePreset } from '@/components/PlanForm';
import PlanTable from '@/components/PlanTable';
import ExportButton from '@/components/ExportButton';
import PdfButton from '@/components/PdfButton';
import { fetchBranches, fetchProducts, fetchSales, fetchSuppliers } from '@/lib/api';
import { Branch, Product, Sale, Supplier, branches as mockBranches, products as mockProducts, sales as mockSales, suppliers as mockSuppliers } from '@/lib/mockData';

export default function Home() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [daysOfCoverage, setDaysOfCoverage] = useState(30);
  const [activePreset, setActivePreset] = useState<DatePreset>('last30Days');
  const [customAnalysisDays, setCustomAnalysisDays] = useState(14);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [planData, setPlanData] = useState<StockPlanRow[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Simulate data loading with Mock Data (No Real API)
    setIsLoadingData(true);
    setTimeout(() => {
      setBranches(mockBranches);
      setProducts(mockProducts);
      setSales(mockSales);
      setSuppliers(mockSuppliers);

      // Auto-select all branches
      if (mockBranches.length > 0) {
        setSelectedBranchIds(mockBranches.map(b => b.id));
      }
      setIsLoadingData(false);
    }, 800); // Small artificial delay for realism
  }, []);

  const productSupplierMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => map.set(p.id, p.supplierId));
    return map;
  }, [products]);

  const availableSuppliers = useMemo(() => {
    if (selectedBranchIds.length === 0) return suppliers;

    const activeSupplierIds = new Set<string>();

    // 1. Check products with stock in selected branches
    products.forEach(p => {
      const hasStock = selectedBranchIds.some(bid => (p.stockByBranch[bid] || 0) > 0);
      if (hasStock) {
        activeSupplierIds.add(p.supplierId);
      }
    });

    // 2. Check sales in selected branches
    sales.forEach(s => {
      if (selectedBranchIds.includes(s.branchId)) {
        const sid = productSupplierMap.get(s.productId);
        if (sid) activeSupplierIds.add(sid);
      }
    });

    return suppliers.filter(s => activeSupplierIds.has(s.id));
  }, [suppliers, products, sales, selectedBranchIds, productSupplierMap]);

  const getDateRange = (preset: DatePreset): { start: Date; end?: Date } => {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'currentWeek':
        const day = start.getDay() || 7;
        start.setDate(start.getDate() - day + 1);
        return { start };
      case 'currentMonth':
        start.setDate(1);
        return { start };
      case 'currentQuarter':
        start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
        return { start };
      case 'currentYear':
        start.setMonth(0, 1);
        return { start };
      case 'lastMonth':
        const lastMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        const lastMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59);
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'lastQuarter':
        const currentQuarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
        const lastQuarterStart = new Date(start.getFullYear(), currentQuarterStartMonth - 3, 1);
        const lastQuarterEnd = new Date(start.getFullYear(), currentQuarterStartMonth, 0, 23, 59, 59);
        return { start: lastQuarterStart, end: lastQuarterEnd };
      case 'lastYear':
        const lastYearStart = new Date(start.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(start.getFullYear() - 1, 11, 31, 23, 59, 59);
        return { start: lastYearStart, end: lastYearEnd };
      case 'last7Days':
        start.setDate(start.getDate() - 7);
        return { start };
      case 'last30Days':
        start.setDate(start.getDate() - 30);
        return { start };
      case 'last60Days':
        start.setDate(start.getDate() - 60);
        return { start };
      case 'last90Days':
        start.setDate(start.getDate() - 90);
        return { start };
      case 'customDays':
        start.setDate(start.getDate() - customAnalysisDays);
        return { start };
      case 'customRange':
        if (customStartDate && customEndDate) {
          return { start: customStartDate, end: customEndDate };
        }
        // Fallback if dates not set
        start.setDate(start.getDate() - 30);
        return { start };
      default:
        start.setDate(start.getDate() - 30);
        return { start };
    }
  };


  const handleCalculate = () => {
    // Debounce protection - prevent multiple rapid clicks
    if (isCalculating) {
      return;
    }

    if (selectedSupplierIds.length === 0) {
      setValidationError('Proszę wybrać co najmniej jednego dostawcę');
      return;
    }
    if (selectedBranchIds.length === 0) {
      setValidationError('Proszę wybrać co najmniej jeden oddział');
      return;
    }
    if (daysOfCoverage < 1) {
      setValidationError('Nieprawidłowa wartość zapasu');
      return;
    }
    if (activePreset === 'customDays' && customAnalysisDays < 1) {
      setValidationError('Okres analizy musi wynosić co najmniej 1 dzień');
      return;
    }
    if (activePreset === 'customRange') {
      if (!customStartDate || !customEndDate) {
        setValidationError('Proszę wybrać daty początkową i końcową');
        return;
      }
      if (customStartDate > customEndDate) {
        setValidationError('Data początkowa nie może być późniejsza niż końcowa');
        return;
      }
    }

    setValidationError('');
    setIsCalculating(true);

    // Wrap in setTimeout to allow UI to update (show spinner) before heavy computation
    setTimeout(() => {
      try {
        const { start, end } = getDateRange(activePreset);
        const calculatedPlan = calculateStockPlan({
          products,
          sales,
          supplierIds: selectedSupplierIds,
          daysOfCoverage,
          analysisStartDate: start,
          analysisEndDate: end,
          branchIds: selectedBranchIds
        });

        setPlanData(calculatedPlan);
      } catch (error) {
        console.error('Error calculating plan:', error);
        setValidationError('Wystąpił błąd podczas obliczania planu.');
      } finally {
        setIsCalculating(false);
      }
    }, 100); // Small delay to let browser render loading state
  };

  const getResultsTitle = () => {
    if (selectedSupplierIds.length === 1) {
      return `Wyniki dla: ${suppliers.find(s => s.id === selectedSupplierIds[0])?.name || 'Wybranego dostawcy'}`;
    }
    return `Wyniki dla wybranych dostawców (${selectedSupplierIds.length})`;
  };

  const getAnalysisPeriodLabel = (): string => {
    const labels: Record<DatePreset, string> = {
      currentWeek: 'Bieżący tydzień',
      currentMonth: 'Bieżący miesiąc',
      currentQuarter: 'Bieżący kwartał',
      currentYear: 'Bieżący rok',
      lastMonth: 'Poprzedni miesiąc',
      lastQuarter: 'Poprzedni kwartał',
      lastYear: 'Poprzedni rok',
      last7Days: 'Ostatnie 7 dni',
      last30Days: 'Ostatnie 30 dni',
      last60Days: 'Ostatnie 60 dni',
      last90Days: 'Ostatnie 90 dni',
      customDays: `Ostatnie ${customAnalysisDays} dni`,
      customRange: customStartDate && customEndDate
        ? `${customStartDate.toLocaleDateString('pl-PL')} - ${customEndDate.toLocaleDateString('pl-PL')}`
        : 'Własny zakres dat'
    };
    return labels[activePreset] || 'Ostatnie 30 dni';
  };

  const selectedBranches = branches.filter(b => selectedBranchIds.includes(b.id));

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xl font-medium text-gray-600">Ładowanie danych z systemu...</div>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 mb-4 text-5xl">⚠️</div>
          <div className="text-xl font-semibold text-gray-800 mb-2">{dataError}</div>
          <p className="text-gray-500 mb-6">Upewnij się, że połączenie z bazą danych jest aktywne.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center md:text-left transition-all">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {process.env.NEXT_PUBLIC_APP_TITLE || 'Planowanie zamówień – Subiekt nexo PRO'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Zautomatyzowany system analizy stanów magazynowych i historycznej sprzedaży dla Twojego biznesu.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-800">Parametry analizy</h2>
          </div>

          <PlanForm
            suppliers={availableSuppliers}
            selectedSupplierIds={selectedSupplierIds}
            onSelectedSupplierIdsChange={setSelectedSupplierIds}
            branches={branches}
            selectedBranchIds={selectedBranchIds}
            onSelectedBranchIdsChange={setSelectedBranchIds}
            daysOfCoverage={daysOfCoverage}
            activePreset={activePreset}
            customAnalysisDays={customAnalysisDays}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onDaysOfCoverageChange={setDaysOfCoverage}
            onPresetChange={setActivePreset}
            onCustomAnalysisDaysChange={setCustomAnalysisDays}
            onCustomStartDateChange={setCustomStartDate}
            onCustomEndDateChange={setCustomEndDate}
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />

          {validationError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium animate-pulse">
              {validationError}
            </div>
          )}
        </div>

        {planData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {getResultsTitle()}
                </h2>
                <p className="text-sm text-gray-500">
                  Wygenerowane na podstawie danych z okresu: <span className="font-medium text-gray-700">{getAnalysisPeriodLabel()}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <ExportButton
                  data={planData}
                  supplierName={selectedSupplierIds.length === 1 ? suppliers.find(s => s.id === selectedSupplierIds[0])?.name || 'Dostawca' : 'Zbiorcze'}
                  daysOfCoverage={daysOfCoverage}
                  analysisPeriodLabel={getAnalysisPeriodLabel()}
                />
                <PdfButton
                  data={planData}
                  supplierName={selectedSupplierIds.length === 1 ? suppliers.find(s => s.id === selectedSupplierIds[0])?.name || 'Dostawca' : 'Zbiorcze'}
                  selectedBranches={selectedBranches}
                  daysOfCoverage={daysOfCoverage}
                  analysisPeriodLabel={getAnalysisPeriodLabel()}
                />
              </div>
            </div>

            <PlanTable data={planData} daysOfCoverage={daysOfCoverage} />
          </div>
        ) : (
          selectedSupplierIds.length > 0 && !isCalculating && planData.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center animate-in fade-in duration-700">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-600 text-xl font-medium">Brak danych do wyświetlenia</p>
              <p className="text-gray-400 mt-2 max-w-md mx-auto">Nie znaleziono produktów przypisanych do wybranych dostawców w wybranym okresie analizy.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
