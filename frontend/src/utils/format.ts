export const toNum = (val: number | string | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(num) ? 0 : num;
};

export const fmtMoney = (val: number | string | null | undefined, decimals = 2): string => {
  return toNum(val).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const fmtPct = (val: number | string | null | undefined, decimals = 2): string => {
  return toNum(val).toFixed(decimals);
};

