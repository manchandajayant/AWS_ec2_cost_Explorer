import { X } from "lucide-react";
export type FilterPillProps = { label: string; onRemove: () => void };

export const FilterPill = ({ label, onRemove }: FilterPillProps) => (
    <div className="flex items-center bg-gray-100 border border-gray-300 rounded text-xs pl-2">
        <span>{label}</span>
        <button onClick={onRemove} className="ml-1 p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full">
            <X size={12} />
        </button>
    </div>
);
