export function formatCurrency(value: unknown, currency = "CAD"): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: unknown): string {
  const timestamp = Date.parse(String(value ?? ""));
  if (!Number.isFinite(timestamp)) return "-";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(timestamp);
}
