import { Branch, Supplier } from '@/lib/mockData';
import BranchMultiSelect from './BranchMultiSelect';
import SupplierMultiSelect from './SupplierMultiSelect';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type DatePreset =
    | 'currentWeek' | 'currentMonth' | 'currentQuarter' | 'currentYear'
    | 'lastMonth' | 'lastQuarter' | 'lastYear'
    | 'last7Days' | 'last30Days' | 'last60Days' | 'last90Days'
    | 'custom';

interface PlanFormProps {
    suppliers: Supplier[];
    selectedSupplierIds: string[];
    onSelectedSupplierIdsChange: (ids: string[]) => void;
    branches: Branch[];
    selectedBranchIds: string[];
    onSelectedBranchIdsChange: (ids: string[]) => void;
    daysOfCoverage: number;
    activePreset: DatePreset;
    customAnalysisDays: number;
    onDaysOfCoverageChange: (value: number) => void;
    onPresetChange: (preset: DatePreset) => void;
    onCustomAnalysisDaysChange: (value: number) => void;
    onCalculate: () => void;
    isCalculating: boolean;
}

const PRESET_LABELS: Record<DatePreset, string> = {
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
    custom: 'Ostatnie N dni',
};

export default function PlanForm({
    suppliers,
    selectedSupplierIds,
    onSelectedSupplierIdsChange,
    branches,
    selectedBranchIds,
    onSelectedBranchIdsChange,
    daysOfCoverage,
    activePreset,
    customAnalysisDays,
    onDaysOfCoverageChange,
    onPresetChange,
    onCustomAnalysisDaysChange,
    onCalculate,
    isCalculating,
}: PlanFormProps) {
    const [isDateOpen, setIsDateOpen] = useState(false);
    const dateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
                setIsDateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SupplierMultiSelect
                    suppliers={suppliers}
                    selectedSupplierIds={selectedSupplierIds}
                    onChange={onSelectedSupplierIdsChange}
                />

                <BranchMultiSelect
                    branches={branches}
                    selectedBranchIds={selectedBranchIds}
                    onChange={onSelectedBranchIdsChange}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        placeholder="np. 30"
                    />
                </div>

                <div className="flex flex-col gap-2 relative" ref={dateRef}>
                    <label className="text-sm font-medium text-gray-700">
                        Okres analizy sprzedaży
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsDateOpen(!isDateOpen);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-left"
                            >
                                <span className="text-gray-900 truncate">
                                    {PRESET_LABELS[activePreset]}
                                </span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform flex-shrink-0 ${isDateOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDateOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                                    {(Object.keys(PRESET_LABELS) as DatePreset[]).map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onPresetChange(preset);
                                                setIsDateOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${activePreset === preset ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                                                }`}
                                        >
                                            {PRESET_LABELS[preset]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {activePreset === 'custom' && (
                            <div className="w-24">
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={customAnalysisDays}
                                    onChange={(e) => onCustomAnalysisDaysChange(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none animate-in fade-in zoom-in-95 duration-200"
                                    placeholder="N..."
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onCalculate();
                    }}
                    disabled={isCalculating || selectedSupplierIds.length === 0 || selectedBranchIds.length === 0}
                    className="w-full md:w-auto px-12 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                    {isCalculating ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Przeliczanie...</span>
                        </div>
                    ) : 'Przelicz zapotrzebowanie'}
                </button>

                {(selectedSupplierIds.length === 0 || selectedBranchIds.length === 0) && (
                    <p className="text-xs text-gray-400 mt-3 italic">
                        * Wybierz co najmniej jednego dostawcę i jeden oddział, aby wygenerować plan.
                    </p>
                )}
            </div>
        </div>
    );
}
