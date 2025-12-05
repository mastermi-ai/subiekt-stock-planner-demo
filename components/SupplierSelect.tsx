import { Supplier } from '@/lib/mockData';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface SupplierSelectProps {
    suppliers: Supplier[];
    value: string;
    onChange: (value: string) => void;
}

export default function SupplierSelect({ suppliers, value, onChange }: SupplierSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get selected supplier object
    const selectedSupplier = suppliers.find(s => s.id === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 250); // 250ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filter suppliers
    const filteredSuppliers = useMemo(() => {
        if (!debouncedSearchTerm) {
            return suppliers.slice(0, 50); // Limit to 50 when no search
        }

        const lowerTerm = debouncedSearchTerm.toLowerCase();
        const filtered = suppliers.filter(s =>
            s.name.toLowerCase().includes(lowerTerm) ||
            (s.nip && s.nip.includes(lowerTerm))
        );

        return filtered.slice(0, 50); // Limit to 50 results
    }, [suppliers, debouncedSearchTerm]);

    const totalMatches = useMemo(() => {
        if (!debouncedSearchTerm) return suppliers.length;
        const lowerTerm = debouncedSearchTerm.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(lowerTerm) ||
            (s.nip && s.nip.includes(lowerTerm))
        ).length;
    }, [suppliers, debouncedSearchTerm]);

    return (
        <div className="flex flex-col gap-2" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-700">
                Dostawca
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white flex justify-between items-center"
                >
                    <span className={selectedSupplier ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedSupplier ? (
                            <span>
                                {selectedSupplier.name}
                                {selectedSupplier.nip && <span className="text-gray-400 text-sm ml-2">(NIP: {selectedSupplier.nip})</span>}
                            </span>
                        ) : 'Wybierz dostawcę'}
                    </span>
                    <ChevronDown size={18} className="text-gray-400" />
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 flex flex-col">
                        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Szukaj dostawcy po nazwie lub NIP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {filteredSuppliers.length > 0 ? (
                                filteredSuppliers.map((supplier) => (
                                    <button
                                        key={supplier.id}
                                        onClick={() => {
                                            onChange(supplier.id);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                            {supplier.nip && (
                                                <div className="text-xs text-gray-500">NIP: {supplier.nip}</div>
                                            )}
                                        </div>
                                        {value === supplier.id && (
                                            <Check size={16} className="text-blue-600" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    Brak wyników
                                </div>
                            )}

                            {totalMatches > 50 && (
                                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center border-t border-gray-100">
                                    Pokazano 50 z {totalMatches} wyników. Zawęż wyszukiwanie.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
