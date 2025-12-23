'use client';

import { useState, useEffect } from 'react';
import { calculateStockPlan, StockPlanRow } from '@/lib/calculatePlan';
import SupplierSelect from '@/components/SupplierSelect';
import PlanForm from '@/components/PlanForm';
import PlanTable from '@/components/PlanTable';
import ExportButton from '@/components/ExportButton';
import PdfButton from '@/components/PdfButton';
import { fetchBranches, fetchProducts, fetchSales, fetchSuppliers } from '@/lib/api';
import { Branch, Product, Sale, Supplier } from '@/lib/mockData';

export default function Home() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [daysOfCoverage, setDaysOfCoverage] = useState(30);
  const [analysisPeriodDays, setAnalysisPeriodDays] = useState(90);
  const [planData, setPlanData] = useState<StockPlanRow[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingData(true);
        const [branchesData, productsData, salesData, suppliersData] = await Promise.all([
          fetchBranches(),
          fetchProducts(),
          fetchSales(180), // Fetch last 6 months of sales by default
          fetchSuppliers()
        ]);

        setBranches(branchesData);
        setProducts(productsData);
        setSales(salesData);
        setSuppliers(suppliersData);

      } catch (err) {
        console.error('Failed to load data:', err);
        setDataError('Nie udało się pobrać danych z serwera.');
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, []);

  const handleCalculate = () => {
    // Validation
    if (!selectedSupplier) {
      setValidationError('Proszę wybrać dostawcę');
      return;
    }
    if (selectedBranchIds.length === 0) {
      setValidationError('Proszę wybrać co najmniej jeden oddział');
      return;
    }
    if (daysOfCoverage < 1 || analysisPeriodDays < 7) {
      setValidationError('Nieprawidłowe wartości parametrów');
      return;
    }

    setValidationError('');
    setIsCalculating(true);

    try {
      // 1. Calculate basic plan
      const basicPlan = calculateStockPlan({
        products,
        sales,
        supplierId: selectedSupplier,
        daysOfCoverage,
        analysisPeriodDays,
        branchIds: selectedBranchIds
      });

      console.log('Plan calculated:', basicPlan.length);

      setPlanData(basicPlan);
    } catch (error) {
      console.error('Error calculating plan:', error);
      setValidationError('Wystąpił błąd podczas obliczania planu.');
    } finally {
      setIsCalculating(false);
    }
  };

  const selectedSupplierName = suppliers.find(s => s.id === selectedSupplier)?.name || selectedSupplier;
  const selectedBranches = branches.filter(b => selectedBranchIds.includes(b.id));

  if (isLoadingData) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-gray-600">Ładowanie danych z systemu...</div>
    </div>;
  }

  if (dataError) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-red-600">{dataError}</div>
    </div>;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Planowanie zamówień – Subiekt nexo PRO
          </h1>
          <p className="text-gray-600 leading-relaxed">
            System do planowania stanów magazynowych na podstawie historycznej sprzedaży.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Parametry planowania</h2>

          <div className="space-y-4">
            <SupplierSelect
              suppliers={suppliers}
              value={selectedSupplier}
              onChange={setSelectedSupplier}
            />

            <PlanForm
              branches={branches}
              selectedBranchIds={selectedBranchIds}
              onSelectedBranchIdsChange={setSelectedBranchIds}
              daysOfCoverage={daysOfCoverage}
              analysisPeriodDays={analysisPeriodDays}
              onDaysOfCoverageChange={setDaysOfCoverage}
              onAnalysisPeriodDaysChange={setAnalysisPeriodDays}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
              selectedSupplier={selectedSupplier}
            />

            {validationError && (
              <div className="text-red-600 text-sm font-medium">
                {validationError}
              </div>
            )}
          </div>


        </div>

        {/* Results Card */}
        {planData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Wyniki dla: {selectedSupplierName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <ExportButton
                  data={planData}
                  supplierName={selectedSupplierName}
                  daysOfCoverage={daysOfCoverage}
                  analysisPeriodDays={analysisPeriodDays}
                />
                <PdfButton
                  data={planData}
                  supplierName={selectedSupplierName}
                  selectedBranches={selectedBranches}
                  daysOfCoverage={daysOfCoverage}
                  analysisPeriodDays={analysisPeriodDays}
                />
              </div>
            </div>

            <PlanTable data={planData} daysOfCoverage={daysOfCoverage} />
          </div>
        )}
      </div>
    </div>
  );
}
