import { describe, expect, it } from "vitest";
import {
  calculateTotalSpend,
  purchasePaidAmount,
  purchaseUnitPaidAmount,
} from "../../collection-summary.js";

describe("purchase calculations", () => {
  it("uses recorded totals and subtracts sales and refunds", () => {
    expect(
      calculateTotalSpend({
        items: [
          {
            name: "A",
            estimatedTotalPaid: 22.39,
            pretaxPrice: 19.99,
            taxRate: 0.12,
          },
          { name: "B", pretaxPrice: 20, taxIncluded: true },
          {
            name: "C",
            pretaxPrice: 10,
            taxRate: 0.12,
            soldItems: [{ salePrice: 5 }],
            returnedItems: [{ refundAmount: 3 }],
          },
        ],
      }),
    ).toBe(45.59);
  });

  it("adds cash paid and subtracts cash received in trades", () => {
    expect(
      calculateTotalSpend(
        { items: [{ name: "A", estimatedTotalPaid: 20 }] },
        {
          items: [
            {
              tradeId: "trade-1",
              tradedAt: "2026-10-21",
              gave: [],
              received: [],
              cashPaid: 5,
            },
            {
              tradeId: "trade-2",
              tradedAt: "2026-10-22",
              gave: [],
              received: [],
              cashReceived: 3,
            },
          ],
        },
      ),
    ).toBe(22);
  });

  it("calculates tax-inclusive paid amounts", () => {
    expect(
      purchasePaidAmount({ pretaxPrice: 19.99, taxRate: 0.12 }),
    ).toBeCloseTo(22.3888);
    expect(purchasePaidAmount({ pretaxPrice: 20, taxIncluded: true })).toBe(20);
    expect(purchasePaidAmount({})).toBe(0);
  });

  it("prefers recorded unit totals and otherwise divides by quantity", () => {
    expect(
      purchaseUnitPaidAmount({ estimatedTotalPaid: 60.71, quantity: 2 }),
    ).toBe(30.36);
    expect(
      purchaseUnitPaidAmount({
        estimatedTotalPaid: 85.94,
        quantity: 3,
        perItemTotal: 28.65,
      }),
    ).toBe(28.65);
  });
});
