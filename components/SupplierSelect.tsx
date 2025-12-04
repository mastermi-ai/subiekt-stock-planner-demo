import { Supplier } from '@/lib/mockData';

interface SupplierSelectProps {
    suppliers: Supplier[];
    value: string;
    onChange: (value: string) => void;
}

export default function SupplierSelect({ suppliers, value, onChange }: SupplierSelectProps) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor="supplier" className="text-sm font-medium text-gray-700">
                Dostawca
            </label>
            <select
                id="supplier"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
                <option value="">Wybierz dostawcę</option>
                {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
