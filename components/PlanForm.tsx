interface PlanFormProps {
    daysOfCoverage: number;
    analysisPeriodDays: number;
    onDaysOfCoverageChange: (value: number) => void;
    onAnalysisPeriodDaysChange: (value: number) => void;
    onCalculate: () => void;
    isCalculating: boolean;
    selectedSupplier: string;
}

export default function PlanForm({
    daysOfCoverage,
    analysisPeriodDays,
    onDaysOfCoverageChange,
    onAnalysisPeriodDaysChange,
    onCalculate,
    isCalculating,
    selectedSupplier
}: PlanFormProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="daysOfCoverage" className="text-sm font-medium text-gray-700">
                        Planowany zapas (dni)
                    </label>
                    <input
                        id="daysOfCoverage"
                        type="number"
                        min="1"
                        max="365"
                        value={daysOfCoverage}
                        onChange={(e) => onDaysOfCoverageChange(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="analysisPeriodDays" className="text-sm font-medium text-gray-700">
                        Okres analizy sprzedaży (dni)
                    </label>
                    <input
                        id="analysisPeriodDays"
                        type="number"
                        min="7"
                        max="365"
                        value={analysisPeriodDays}
                        onChange={(e) => onAnalysisPeriodDaysChange(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            <button
                onClick={onCalculate}
                disabled={isCalculating || !selectedSupplier}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                {isCalculating ? 'Przeliczanie...' : 'Przelicz zapotrzebowanie'}
            </button>
        </div>
    );
}
