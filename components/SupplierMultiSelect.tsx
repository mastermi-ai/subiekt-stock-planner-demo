import { Supplier } from '@/lib/mockData';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SupplierMultiSelectProps {
    suppliers: Supplier[];
    selectedSupplierIds: string[];
    onChange: (ids: string[]) => void;
}

export default function SupplierMultiSelect({ suppliers, selectedSupplierIds, onChange }: SupplierMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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

    const toggleSupplier = (supplierId: string) => {
        if (selectedSupplierIds.includes(supplierId)) {
            onChange(selectedSupplierIds.filter(id => id !== supplierId));
        } else {
            onChange([...selectedSupplierIds, supplierId]);
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nip && s.nip.includes(searchTerm))
    );

    const selectedCount = selectedSupplierIds.length;
    const displayText = selectedCount === 0
        ? 'Wybierz dostawców...'
        : selectedCount === 1
            ? suppliers.find(s => s.id === selectedSupplierIds[0])?.name || 'Wybrano: 1'
            : `Wybrano: ${selectedCount}`;

    return (
        <div className="flex flex-col gap-2 relative w-full" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-700">
                Dostawcy
            </label>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-left w-full"
            >
                <span className={`block truncate ${selectedCount === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                    {displayText}
                </span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 flex flex-col">
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Szukaj..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredSuppliers.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">Brak wyników</div>
                        ) : (
                            filteredSuppliers.map((supplier) => {
                                const isSelected = selectedSupplierIds.includes(supplier.id);
                                return (
                                    <div
                                        key={supplier.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSupplier(supplier.id);
                                        }}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className={`w-5 h-5 border rounded flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                                            }`}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>
                                        <div className="flex flex-col overflow-hidden pointer-events-none">
                                            <span className="text-sm text-gray-700 truncate">{supplier.name}</span>
                                            {supplier.nip && <span className="text-xs text-gray-400 truncate">NIP: {supplier.nip}</span>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
