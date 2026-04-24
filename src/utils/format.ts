export function formatCurrency(value: number, symbol = '৳', fractionDigits = 0): string {
  if (!isFinite(value)) return `${symbol}0`;
  const rounded = Number(value.toFixed(fractionDigits));
  return `${symbol}${rounded.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatNumber(value: number, fractionDigits = 2): string {
  if (!isFinite(value)) return '0';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}

export function formatKm(value: number): string {
  return `${formatNumber(value, 0)} km`;
}

export function formatLiters(value: number): string {
  return `${formatNumber(value, 2)} L`;
}
