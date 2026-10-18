import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { ProductListingCard } from "@/components/product-listing-card";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { RetailerListing } from "@/domain/types";
import {
  availabilityOrder,
  compareCatalogueItems,
  matchesCatalogueSearch,
  type CatalogueSort,
} from "@/features/catalogue/catalogue-domain";
import { usePublicCatalogue } from "@/features/catalogue/use-public-catalogue";
import { formatCurrency, formatDate } from "@/lib/format";

const selectClass =
  "h-10 rounded-lg border border-input bg-card px-3 text-sm font-semibold text-foreground";

export function CataloguePage() {
  const catalogue = usePublicCatalogue();
  const [query, setQuery] = useState("");
  const [retailer, setRetailer] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<CatalogueSort>("recent");

  const sourceItems = useMemo(
    () =>
      catalogue.status === "ready"
        ? (catalogue.data.items as unknown as RetailerListing[])
        : [],
    [catalogue],
  );
  const retailers = useMemo(
    () => [...new Set(sourceItems.map((item) => item.retailer))].sort(),
    [sourceItems],
  );
  const items = useMemo(
    () =>
      sourceItems
        .filter((item) => !retailer || item.retailer === retailer)
        .filter((item) => !status || item.availabilityStatus === status)
        .filter((item) => matchesCatalogueSearch(item, query))
        .sort((a, b) => compareCatalogueItems(a, b, sort)),
    [sourceItems, query, retailer, status, sort],
  );

  const columns = useMemo<ColumnDef<RetailerListing>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-72 items-center gap-3 font-bold text-foreground hover:text-primary"
          >
            <ProductThumbnail
              name={row.original.name}
              imageUrl={row.original.imageUrl}
              className="size-14"
            />
            <span>
              {row.original.name}
              <small className="mt-1 block font-normal text-muted-foreground">
                {row.original.bundleType}
              </small>
            </span>
          </a>
        ),
      },
      { accessorKey: "retailer", header: "Retailer" },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) =>
          formatCurrency(row.original.price, row.original.currency ?? "CAD"),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge item={row.original} />,
      },
      {
        id: "configs",
        header: "Configs",
        cell: ({ row }) => row.original.configs.join(", ") || "-",
      },
      {
        id: "seen",
        header: "Last observed",
        cell: ({ row }) => formatDate(row.original.lastSeenAt),
      },
    ],
    [],
  );

  if (catalogue.status === "error")
    return (
      <ErrorState title="Catalogue unavailable" message={catalogue.error} />
    );
  if (catalogue.status === "loading")
    return (
      <div aria-busy="true">
        <PageHeader
          title="Catalogue"
          description="Loading the public retailer snapshot…"
        />
      </div>
    );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Public retailer snapshot"
        title="Catalogue"
        description="Every verified crawled listing stays visible, whether available now, delayed, out of stock, or unavailable."
      />
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search catalogue</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search products, configs, or retailer"
          />
        </label>
        <label>
          <span className="sr-only">Retailer</span>
          <select
            className={selectClass}
            value={retailer}
            onChange={(event) => setRetailer(event.target.value)}
          >
            <option value="">All retailers</option>
            {retailers.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Availability</span>
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {availabilityOrder.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort catalogue</span>
          <select
            className={selectClass}
            value={sort}
            onChange={(event) => setSort(event.target.value as CatalogueSort)}
          >
            <option value="recent">Recently observed</option>
            <option value="name">Name</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
            <option value="retailer">Retailer</option>
            <option value="availability">Availability</option>
          </select>
        </label>
      </div>
      <p className="text-sm font-bold text-muted-foreground">
        {items.length} of {sourceItems.length} listings
      </p>
      <DataTable
        data={items}
        columns={columns}
        getRowId={(item) => item.listingId}
        empty={
          <EmptyState
            title="No catalogue matches"
            description="Clear or broaden the current search and filters."
          />
        }
        mobileCard={(item) => (
          <ProductListingCard
            name={item.name}
            imageUrl={item.imageUrl}
            href={item.url}
            meta={
              <>
                {item.retailer} ·{" "}
                {formatCurrency(item.price, item.currency ?? "CAD")}
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge item={item} />
              <span className="text-xs text-muted-foreground">
                {item.configs.join(", ") || "-"}
              </span>
            </div>
          </ProductListingCard>
        )}
      />
    </div>
  );
}

function StatusBadge({ item }: { item: RetailerListing }) {
  const variant =
    item.availabilityStatus === "available_now"
      ? "success"
      : ["preorder", "delayed", "backorder"].includes(item.availabilityStatus)
        ? "warning"
        : ["out_of_stock", "unavailable"].includes(item.availabilityStatus)
          ? "destructive"
          : "outline";
  return (
    <Badge variant={variant}>
      {item.statusLabel ?? statusLabel(item.availabilityStatus)}
    </Badge>
  );
}

function statusLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
