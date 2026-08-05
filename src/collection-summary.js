export function calculateTotalSpend(purchases) {
  const total = (purchases?.items || []).reduce((sum, item) => sum + purchasePaidAmount(item), 0);
  return Math.round(total * 100) / 100;
}

export function purchasePaidAmount(item) {
  const estimated = Number(item?.estimatedTotalPaid);
  if (Number.isFinite(estimated)) return estimated;

  const pretax = Number(item?.pretaxPrice);
  if (!Number.isFinite(pretax)) return 0;
  if (item.taxIncluded === true) return pretax;

  const taxRate = Number(item?.taxRate);
  return Number.isFinite(taxRate) ? pretax * (1 + taxRate) : pretax;
}
