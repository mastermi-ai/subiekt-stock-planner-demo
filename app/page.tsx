'use client';

import { useState } from 'react';
import { suppliers, products, sales, branches } from '@/lib/mockData';
import { calculateStockPlan, StockPlanRow } from '@/lib/calculatePlan';
import SupplierSelect from '@/components/SupplierSelect';
import PlanForm from '@/components/PlanForm';
import PlanTable from '@/components/PlanTable';
import ExportButton from '@/components/ExportButton';
import PdfButton from '@/components/PdfButton';

export default function Home() {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [daysOfCoverage, setDaysOfCoverage] = useState(30);
  const [analysisPeriodDays, setAnalysisPeriodDays] = useState(90);
  const [planData, setPlanData] = useState<StockPlanRow[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationError, setValidationError] = useState('');

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

  const selectedSupplierName = suppliers.find(s => s.id === selectedSupplier)?.name || '';
  const selectedBranches = branches.filter(b => selectedBranchIds.includes(b.id));

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Planowanie zamówień – wizualizacja dla Subiekt nexo PRO
          </h1>
          <p className="text-gray-600 leading-relaxed">
            To jest wizualizacja systemu do planowania stanów magazynowych na podstawie historycznej sprzedaży.
            Dane są przykładowe (mock), ale logika liczenia odpowiada docelowej wersji po podłączeniu do Subiekt nexo PRO.
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

          <div className="mt-4 text-sm text-gray-500 italic">
            💡 To demo na danych przykładowych. W docelowej wersji dane będą pobierane z Subiekt nexo PRO.
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
