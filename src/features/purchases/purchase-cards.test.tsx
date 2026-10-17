// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PurchaseHistoryCard } from "@/features/purchases/purchase-cards";

describe("PurchaseHistoryCard", () => {
  it("shows the tax-inclusive unit price for a multi-quantity purchase", () => {
    render(
      <PurchaseHistoryCard
        purchase={{
          name: "Shark Scale 4-50UF",
          source: "Mactera Direct",
          quantity: 3,
          estimatedTotalPaid: 85.94,
          perItemTotal: 28.65,
        }}
        currency="CAD"
      />,
    );
    expect(screen.getByText(/Qty 3/)).toBeInTheDocument();
    expect(screen.getByText(/28\.65/)).toBeInTheDocument();
    expect(screen.queryByText(/85\.94/)).not.toBeInTheDocument();
  });

  it("shows sold, returned, and gifted events instead of Kept", () => {
    render(
      <PurchaseHistoryCard
        purchase={{
          name: "Example Set",
          estimatedTotalPaid: 60,
          soldItems: [{ name: "Sold Bey", salePrice: 25 }],
          returnedItems: [{ name: "Returned Bey", refundAmount: 20 }],
          giftedItems: [{ name: "Gifted Bey" }],
        }}
        currency="CAD"
      />,
    );
    expect(screen.getByText(/Sold: Sold Bey/)).toBeInTheDocument();
    expect(screen.getByText(/Returned: Returned Bey/)).toBeInTheDocument();
    expect(screen.getByText(/Gifted: Gifted Bey/)).toBeInTheDocument();
    expect(screen.queryByText("Kept")).not.toBeInTheDocument();
  });
});
