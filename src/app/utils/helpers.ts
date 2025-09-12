export const iso = (d: Date) => d.toISOString().slice(0, 10);

export const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

export const addDaysISO = (isoDate: string, n: number) => {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + n);
    return iso(d);
};

export const fmtUSD = (n: number) => {
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};
