// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  OwnedProductCard,
  PurchaseHistoryCard,
} from "@/features/purchases/purchase-cards";
import { summarizeOwnedPurchases } from "@/features/purchases/purchase-domain";

describe("PurchaseHistoryCard", () => {
  it("shows the average paid across separate owned purchases", () => {
    const summary = summarizeOwnedPurchases(
      [
        {
          name: "Suppress Superion 0-70LP",
          source: "Mactera Direct",
          estimatedTotalPaid: 36.21,
        },
        {
          name: "Suppress Superion 0-70LP",
          source: "Amazon.ca",
          estimatedTotalPaid: 22.39,
        },
      ],
      "Suppress Superion 0-70LP (x2)",
    );
    expect(summary).toMatchObject({
      source: "Mactera Direct; Amazon.ca",
      unitPaid: 29.3,
    });
    render(
      <OwnedProductCard
        name="Suppress Superion 0-70LP (x2)"
        source={summary?.source}
        unitPaid={summary?.unitPaid}
        currency="CAD"
      />,
    );
    expect(screen.getByText("Mactera Direct; Amazon.ca")).toBeInTheDocument();
    expect(screen.getByText(/29\.30/)).toBeInTheDocument();
  });

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
