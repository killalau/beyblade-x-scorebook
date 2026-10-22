// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  OwnedProductCard,
  PurchaseHistoryCard,
  TradeHistoryCard,
} from "@/features/purchases/purchase-cards";
import { summarizeOwnedAcquisitions } from "@/features/purchases/purchase-domain";

describe("PurchaseHistoryCard", () => {
  it("shows the average paid across separate owned purchases", () => {
    const summary = summarizeOwnedAcquisitions(
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
      unitCost: 29.3,
      quantity: 2,
    });
    render(
      <OwnedProductCard
        name="Suppress Superion 0-70LP (x2)"
        source={summary?.source}
        unitCost={summary?.unitCost}
        quantity={summary?.quantity}
        currency="CAD"
      />,
    );
    expect(screen.getByText("Mactera Direct; Amazon.ca")).toBeInTheDocument();
    expect(screen.getByText(/29\.30/)).toBeInTheDocument();
  });

  it("transfers a traded lot's cost basis into the owned average", () => {
    const summary = summarizeOwnedAcquisitions(
      [
        {
          acquisitionId: "purchase-rocket",
          name: "Rocket Griffon H",
          source: "Mactera Direct",
          estimatedTotalPaid: 36.39,
        },
        {
          acquisitionId: "purchase-suppress-amazon",
          name: "Suppress Superion 0-70LP",
          source: "Amazon.ca",
          estimatedTotalPaid: 22.39,
        },
      ],
      "Rocket Griffon H (x2)",
      [
        {
          tradeId: "trade-suppress-for-rocket",
          tradedAt: "2026-10-21",
          source: "Private trade",
          gave: [
            {
              name: "Suppress Superion 0-70LP",
              fromAcquisitionId: "purchase-suppress-amazon",
              transferredCostBasis: 22.39,
            },
          ],
          received: [
            {
              acquisitionId: "trade-rocket",
              name: "Rocket Griffon H",
              brand: "Hasbro",
              costBasis: 22.39,
              imageUrl: "https://example.com/rocket.jpg",
            },
          ],
        },
      ],
    );
    expect(summary).toMatchObject({
      source: "Mactera Direct; Private trade",
      unitCost: 29.39,
      quantity: 2,
    });
    expect(
      summarizeOwnedAcquisitions(
        [
          {
            name: "Suppress Superion 0-70LP",
            source: "Mactera Direct",
            estimatedTotalPaid: 36.21,
          },
          {
            acquisitionId: "purchase-suppress-amazon",
            name: "Suppress Superion 0-70LP",
            source: "Amazon.ca",
            estimatedTotalPaid: 22.39,
          },
        ],
        "Suppress Superion 0-70LP",
        [
          {
            tradeId: "trade-suppress-for-rocket",
            tradedAt: "2026-10-21",
            gave: [
              {
                name: "Suppress Superion 0-70LP",
                fromAcquisitionId: "purchase-suppress-amazon",
                transferredCostBasis: 22.39,
              },
            ],
            received: [
              {
                acquisitionId: "trade-rocket",
                name: "Rocket Griffon H",
                brand: "Hasbro",
                costBasis: 22.39,
                imageUrl: "https://example.com/rocket.jpg",
              },
            ],
          },
        ],
      ),
    ).toMatchObject({ source: "Mactera Direct", unitCost: 36.21, quantity: 1 });
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

  it("shows linked trade events and trade history cost basis", () => {
    const trade = {
      tradeId: "trade-suppress-for-rocket",
      tradedAt: "2026-10-21",
      source: "Private trade",
      gave: [
        {
          name: "Suppress Superion 0-70LP",
          fromAcquisitionId: "purchase-suppress-amazon",
          transferredCostBasis: 22.39,
        },
      ],
      received: [
        {
          acquisitionId: "trade-rocket",
          name: "Rocket Griffon H",
          brand: "Hasbro" as const,
          costBasis: 22.39,
          imageUrl: "https://example.com/rocket.jpg",
        },
      ],
      cashPaid: 0,
      cashReceived: 0,
    };
    render(
      <>
        <PurchaseHistoryCard
          purchase={{
            acquisitionId: "purchase-suppress-amazon",
            name: "Suppress Superion 0-70LP",
          }}
          trades={[trade]}
          currency="CAD"
        />
        <TradeHistoryCard trade={trade} currency="CAD" />
      </>,
    );
    expect(
      screen.getByText(/Traded: Suppress Superion.*Rocket Griffon/),
    ).toBeInTheDocument();
    expect(screen.getByText("Even trade")).toBeInTheDocument();
    expect(screen.getAllByText(/cost basis/)).toHaveLength(2);
  });
});
