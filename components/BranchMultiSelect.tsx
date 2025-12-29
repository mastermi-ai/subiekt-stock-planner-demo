import { Branch } from '@/lib/mockData';
import { Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface BranchMultiSelectProps {
    branches: Branch[];
    selectedBranchIds: string[];
    onChange: (ids: string[]) => void;
}

export default function BranchMultiSelect({ branches, selectedBranchIds, onChange }: BranchMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleBranch = (branchId: string) => {
        if (selectedBranchIds.includes(branchId)) {
            onChange(selectedBranchIds.filter(id => id !== branchId));
        } else {
            onChange([...selectedBranchIds, branchId]);
        }
    };

    const selectedCount = selectedBranchIds.length;
    const displayText = selectedCount === 0
        ? 'Wybierz oddziały...'
        : selectedCount === branches.length
            ? 'Wszystkie oddziały'
            : `Wybrano: ${selectedCount}`;

    return (
        <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-700">
                Oddziały do analizy
            </label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-left"
            >
                <span className={selectedCount === 0 ? 'text-gray-500' : 'text-gray-900'}>
                    {displayText}
                </span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {branches.map((branch) => {
                        const isSelected = selectedBranchIds.includes(branch.id);
                        return (
                            <div
                                key={branch.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBranch(branch.id);
                                }}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className={`w-5 h-5 border rounded flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                                    }`}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                                <span className="text-sm text-gray-700 pointer-events-none">{branch.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
