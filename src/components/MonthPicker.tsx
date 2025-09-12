import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type MonthPickerProps = {
  initialA?: string; // YYYY-MM
  initialB?: string; // YYYY-MM
  onApply?: (monthA: string, monthB: string) => void;
  disabled?: boolean;
  className?: string;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseYYYYMM(s?: string): { year: number; month: number } {
  if (!s) {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }
  const [y, m] = s.split("-").map((x) => parseInt(x, 10));
  return { year: isNaN(y) ? new Date().getFullYear() : y, month: isNaN(m) ? new Date().getMonth() : Math.min(11, Math.max(0, (m || 1) - 1)) };
}

function toYYYYMM(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ initialA, initialB, onApply, disabled, className = "" }) => {
  const [a, setA] = useState<string>(initialA || toYYYYMM(new Date().getFullYear(), new Date().getMonth()));
  const [b, setB] = useState<string>(initialB || toYYYYMM(new Date().getFullYear(), new Date().getMonth() - 1));

  const [open, setOpen] = useState<"a" | "b" | null>(null);
  const [yearA, setYearA] = useState<number>(parseYYYYMM(initialA).year);
  const [yearB, setYearB] = useState<number>(parseYYYYMM(initialB).year);

  const refA = useRef<HTMLDivElement>(null);
  const refB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (open === "a" && refA.current && !refA.current.contains(t)) setOpen(null);
      if (open === "b" && refB.current && !refB.current.contains(t)) setOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const renderDropdown = (which: "a" | "b") => {
    const year = which === "a" ? yearA : yearB;
    const setYear = which === "a" ? setYearA : setYearB;
    const selected = which === "a" ? a : b;
    const onSelect = (mi: number) => {
      const val = toYYYYMM(year, mi);
      if (which === "a") setA(val);
      else setB(val);
      setOpen(null);
    };
    const sel = parseYYYYMM(selected);

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => setYear(year - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="font-semibold text-gray-900">{year}</div>
          <button type="button" onClick={() => setYear(year + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((m, i) => {
            const isSelected = sel.year === year && sel.month === i;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelect(i)}
                className={`py-2 text-sm rounded-lg border transition-colors ${
                  isSelected ? "bg-gray-200 text-gray-900 border-gray-300" : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                }`}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const formatLabel = (s: string) => {
    const { year, month } = parseYYYYMM(s);
    return `${months[month].slice(0, 3)} ${year}`;
  };

  return (
    <div className={`bg-white rounded-2xl py-6 ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Months</h3>
          <p className="text-sm text-gray-500">Compare two months side by side</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Month A */}
        <div className="relative" ref={refA}>
          <label className="block text-sm font-medium text-gray-700 mb-2">Month A</label>
          <button
            type="button"
            onClick={() => !disabled && setOpen(open === "a" ? null : "a")}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 cursor-pointer hover:border-gray-300 flex items-center justify-between"
          >
            <span>{formatLabel(a)}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open === "a" ? "rotate-180" : ""}`} />
          </button>
          {open === "a" && renderDropdown("a")}
        </div>

        {/* Month B */}
        <div className="relative" ref={refB}>
          <label className="block text-sm font-medium text-gray-700 mb-2">Month B</label>
          <button
            type="button"
            onClick={() => !disabled && setOpen(open === "b" ? null : "b")}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 cursor-pointer hover:border-gray-300 flex items-center justify-between"
          >
            <span>{formatLabel(b)}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open === "b" ? "rotate-180" : ""}`} />
          </button>
          {open === "b" && renderDropdown("b")}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onApply?.(a, b)}
        className="mt-6 w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        Apply Months
      </button>
    </div>
  );
};

export default MonthPicker;

