import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Type definitions
interface CalendarState {
    month: number;
    year: number;
}

interface DateRange {
    start: string;
    end: string;
}

interface PresetOption {
    label: string;
    days: number;
}

interface ModernDatePickerProps {
    onApply?: (start: string, end: string) => void;
    initialStart?: string;
    initialEnd?: string;
    disabled?: boolean;
    className?: string;
}

interface CalendarDropdownProps {
    isStart: boolean;
    calendar: CalendarState;
    start: string;
    end: string;
    onDateSelect: (day: number | null, isStart: boolean) => void;
    onNavigateMonth: (direction: number, isStart: boolean) => void;
}

export const ModernDatePicker: React.FC<ModernDatePickerProps> = ({ onApply, initialStart = "", initialEnd = "", disabled = false, className = "" }) => {
    const [start, setStart] = useState<string>(initialStart);
    const [end, setEnd] = useState<string>(initialEnd);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeDropdown, setActiveDropdown] = useState<"start" | "end" | null>(null);
    const [startCalendar, setStartCalendar] = useState<CalendarState>({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });
    const [endCalendar, setEndCalendar] = useState<CalendarState>({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });

    const startRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);

    const handleApply = async (): Promise<void> => {
        if (!start || !end || disabled) return;

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onApply?.(start, end);
        }, 500);
    };

    const formatDateLabel = (dateValue: string): string => {
        if (!dateValue) return "";
        const date = new Date(dateValue);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const months: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const generateCalendarDays = (month: number, year: number): (number | null)[] => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const handleDateSelect = (day: number | null, isStart: boolean): void => {
        if (!day || disabled) return;

        const calendar = isStart ? startCalendar : endCalendar;
        const dateStr = `${calendar.year}-${String(calendar.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        if (isStart) {
            setStart(dateStr);
        } else {
            setEnd(dateStr);
        }

        setActiveDropdown(null);
    };

    const navigateMonth = (direction: number, isStart: boolean): void => {
        if (disabled) return;

        const calendar = isStart ? startCalendar : endCalendar;
        const setCalendar = isStart ? setStartCalendar : setEndCalendar;

        let newMonth = calendar.month + direction;
        let newYear = calendar.year;

        if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        }

        setCalendar({ month: newMonth, year: newYear });
    };

    const isDateInRange = (day: number | null, calendar: CalendarState): boolean => {
        if (!start || !end || !day) return false;

        const currentDate = new Date(calendar.year, calendar.month, day);
        const startDate = new Date(start);
        const endDate = new Date(end);

        return currentDate >= startDate && currentDate <= endDate;
    };

    const isDateSelected = (day: number | null, calendar: CalendarState): boolean => {
        if (!day) return false;

        const dateStr = `${calendar.year}-${String(calendar.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return dateStr === start || dateStr === end;
    };

    const CalendarDropdown: React.FC<CalendarDropdownProps> = ({ isStart, calendar, start, end, onDateSelect, onNavigateMonth }) => {
        const days = generateCalendarDays(calendar.month, calendar.year);
        const today = new Date();

        return (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-in slide-in-from-top-2 duration-200">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => onNavigateMonth(-1, isStart)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={disabled}
                        type="button"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="font-semibold text-gray-900">
                        {months[calendar.month]} {calendar.year}
                    </div>

                    <button
                        onClick={() => onNavigateMonth(1, isStart)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={disabled}
                        type="button"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const).map((day) => (
                        <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                        const isToday = day !== null && calendar.year === today.getFullYear() && calendar.month === today.getMonth() && day === today.getDate();

                        const isSelected = isDateSelected(day, calendar);
                        const inRange = isDateInRange(day, calendar);

                        return (
                            <button
                                key={index}
                                onClick={() => onDateSelect(day, isStart)}
                                disabled={!day || disabled}
                                type="button"
                                className={`h-8 w-8 flex items-center justify-center text-sm rounded-lg transition-all duration-150 ${
                                    !day
                                        ? "cursor-default"
                                        : isSelected
                                        ? "bg-blue-100 border-blue-500 to-gray-600 text-black shadow-md"
                                        : inRange
                                        ? "bg-blue-100 border-blue-500 text-blue-700"
                                        : isToday
                                        ? "bg-gray-200 text-gray-900 font-semibold"
                                        : "hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                }`}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            const target = event.target as Node;

            if (activeDropdown === "start" && startRef.current && !startRef.current.contains(target)) {
                setActiveDropdown(null);
            }
            if (activeDropdown === "end" && endRef.current && !endRef.current.contains(target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeDropdown]);

    const presetOptions: PresetOption[] = [
        { label: "Today", days: 0 },
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 },
    ];

    const handlePresetClick = (preset: PresetOption): void => {
        if (disabled) return;

        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - preset.days);

        setStart(preset.days === 0 ? today.toISOString().split("T")[0] : pastDate.toISOString().split("T")[0]);
        setEnd(today.toISOString().split("T")[0]);
        setActiveDropdown(null);
    };

    const calculateDaysDifference = (): number => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <div className={`bg-white rounded-2xl py-6 max-w-lg ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-400 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-50" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
                </div>
            </div>

            {/* Date Inputs */}
            <div className="space-y-4 mb-6">
                {/* Start Date */}
                <div className="relative" ref={startRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <button
                        onClick={() => !disabled && setActiveDropdown(activeDropdown === "start" ? null : "start")}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 cursor-pointer hover:border-gray-300 flex items-center justify-between disabled:cursor-not-allowed disabled:hover:border-gray-200"
                        disabled={disabled}
                        type="button"
                    >
                        <span className={start ? "text-gray-900" : "text-gray-400"}>{start ? formatDateLabel(start) : "Select start date"}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activeDropdown === "start" ? "rotate-180" : ""}`} />
                    </button>

                    {activeDropdown === "start" && <CalendarDropdown isStart={true} calendar={startCalendar} start={start} end={end} onDateSelect={handleDateSelect} onNavigateMonth={navigateMonth} />}
                </div>

                {/* Arrow Connector
                <div className="flex justify-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                </div> */}

                {/* End Date */}
                <div className="relative" ref={endRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <button
                        onClick={() => !disabled && setActiveDropdown(activeDropdown === "end" ? null : "end")}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200 cursor-pointer hover:border-gray-300 flex items-center justify-between disabled:cursor-not-allowed disabled:hover:border-gray-200"
                        disabled={disabled}
                        type="button"
                    >
                        <span className={end ? "text-gray-900" : "text-gray-400"}>{end ? formatDateLabel(end) : "Select end date"}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${activeDropdown === "end" ? "rotate-180" : ""}`} />
                    </button>

                    {activeDropdown === "end" && <CalendarDropdown isStart={false} calendar={endCalendar} start={start} end={end} onDateSelect={handleDateSelect} onNavigateMonth={navigateMonth} />}
                </div>
            </div>

            {/* Apply Button */}
            <button
                onClick={handleApply}
                disabled={!start || !end || isLoading || disabled}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    start && end && !isLoading && !disabled ? "bg-gradient-to-r bg-gray-600 text-gray-100 shadow-lg hover:shadow-xl" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                type="button"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Applying...
                    </div>
                ) : (
                    "Apply Date Range"
                )}
            </button>

            {/* Quick Actions */}
            {/* <div className="mt-4 flex gap-2">
                {presetOptions.map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset)}
                        disabled={disabled}
                        className="flex-1 py-2 px-3 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:text-gray-600"
                        type="button"
                    >
                        {preset.label}
                    </button>
                ))}
            </div> */}
        </div>
    );
};

// Demo usage component with TypeScript
const App: React.FC = () => {
    const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);

    const handleDateApply = (start: string, end: string): void => {
        setSelectedRange({ start, end });
        console.log("Date range applied:", { start, end });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8"></div>

                <ModernDatePicker onApply={handleDateApply} />

                {selectedRange && (
                    <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-2">Selected Range:</h3>
                        <p className="text-gray-700">
                            From: <span className="font-medium">{selectedRange.start}</span> → To: <span className="font-medium">{selectedRange.end}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
