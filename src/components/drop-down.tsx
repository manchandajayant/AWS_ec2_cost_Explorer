"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";
import React from "react";

export type DropdownOption<T extends string | number> = {
    label: string;
    value: T;
};

type DropdownProps<T extends string | number> = {
    label?: string;
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    className?: string;
    buttonClassName?: string;
};

export default function Dropdown<T extends string | number>({
    label,
    value,
    options,
    onChange,
    className = "",
    buttonClassName = "",
}: DropdownProps<T>) {
    const selected = options.find((o) => o.value === value) ?? options[0];

    return (
        <div className={className}>
            {label ? (
                <label className="block text-sm font-medium text-gray-700">{label}</label>
            ) : null}
            <Listbox value={selected?.value} onChange={onChange}>
                <div className="relative mt-1">
                    <ListboxButton
                        className={
                            buttonClassName ||
                            "grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm"
                        }
                    >
                        <span className="col-start-1 row-start-1 truncate pr-6">{selected?.label ?? String(value)}</span>
                        <ChevronDown aria-hidden="true" className="col-start-1 row-start-1 h-5 w-5 self-center justify-self-end text-gray-500 sm:h-4 sm:w-4" />
                    </ListboxButton>

                    <ListboxOptions
                        transition
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                    >
                        {options.map((opt) => (
                            <ListboxOption
                                key={String(opt.value)}
                                value={opt.value}
                                className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                            >
                                <span className="block truncate font-normal group-data-selected:font-semibold">{opt.label}</span>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white">
                                    <Check aria-hidden="true" className="h-5 w-5" />
                                </span>
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>
        </div>
    );
}
