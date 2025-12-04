'use client';

import { useState } from 'react';
import { suppliers, products, sales } from '@/lib/mockData';
import { calculateStockPlan, StockPlanRow } from '@/lib/calculatePlan';
import SupplierSelect from '@/components/SupplierSelect';
import PlanForm from '@/components/PlanForm';
import PlanTable from '@/components/PlanTable';
import ExportButton from '@/components/ExportButton';

export default function Home() {
  const [selectedSupplier, setSelectedSupplier] = useState('');
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
    if (daysOfCoverage < 1 || analysisPeriodDays < 7) {
      setValidationError('Nieprawidłowe wartości parametrów');
      return;
    }

    setValidationError('');
    setIsCalculating(true);

    // Simulate async calculation (even though it's fast)
    setTimeout(() => {
      const result = calculateStockPlan({
        products,
        sales,
        supplierId: selectedSupplier,
        daysOfCoverage,
        analysisPeriodDays
      });
      setPlanData(result);
      setIsCalculating(false);
    }, 300);
  };

  const selectedSupplierName = suppliers.find(s => s.id === selectedSupplier)?.name || '';

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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Wyniki dla: {selectedSupplierName}
              </h2>
              <ExportButton
                data={planData}
                supplierName={selectedSupplierName}
                daysOfCoverage={daysOfCoverage}
                analysisPeriodDays={analysisPeriodDays}
              />
            </div>

            <PlanTable data={planData} daysOfCoverage={daysOfCoverage} />
          </div>
        )}
      </div>
    </div>
  );
}
