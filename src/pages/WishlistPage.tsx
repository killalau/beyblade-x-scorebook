import type { ColumnDef } from "@tanstack/react-table";
import { Grid2X2, List, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/empty-state";
import { FileUpload } from "@/components/file-upload";
import { PageHeader } from "@/components/page-header";
import { ProductListingCard } from "@/components/product-listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WishlistItem } from "@/domain/types";
import { usePrivateData } from "@/features/private-data/use-private-data";
import {
  compareWishlistItems,
  matchesWishlistSearch,
  type WishlistSort,
} from "@/features/wishlist/wishlist-domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesPartFilters, partFilterTokens } from "@/wishlist-filters.js";

const viewKey = "beybladeScorebook.wishlistView";
const filterKey = "beybladeScorebook.wishlistPartFilters";
const selectClass =
  "h-10 rounded-lg border border-input bg-card px-3 text-sm font-semibold text-foreground";
type View = "card" | "list";
type PartFilters = {
  parts: string;
  type: string;
  match: "any" | "all";
  onlyMissing: boolean;
};

export function WishlistPage() {
  const { wishlist, loadWishlist } = usePrivateData();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<WishlistSort>("costIndex");
  const [view, setView] = useState<View>(readView);
  const [filters, setFilters] = useState<PartFilters>(readFilters);

  useEffect(() => localStorage.setItem(viewKey, view), [view]);
  useEffect(
    () => localStorage.setItem(filterKey, JSON.stringify(filters)),
    [filters],
  );

  const sourceItems = useMemo(
    () => (wishlist?.data.items ?? []) as unknown as WishlistItem[],
    [wishlist],
  );
  const partNames = useMemo(
    () =>
      [
        ...new Set(
          sourceItems.flatMap(
            (item) => item.parts?.map((part) => part.name) ?? [],
          ),
        ),
      ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [sourceItems],
  );
  const items = useMemo(() => {
    const requestedParts = partFilterTokens(filters.parts);
    return sourceItems
      .filter((item) => matchesWishlistSearch(item, query))
      .filter((item) =>
        matchesPartFilters(item, {
          requestedParts,
          partType: filters.type,
          matchAll: filters.match === "all",
          onlyMissing: filters.onlyMissing,
        }),
      )
      .sort((a, b) => compareWishlistItems(a, b, sort));
  }, [sourceItems, query, sort, filters]);

  const columns = useMemo<ColumnDef<WishlistItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) =>
          row.original.url ? (
            <a
              href={row.original.url}
              target="_blank"
              rel="noreferrer"
              className="font-bold hover:text-primary"
            >
              {row.original.name}
            </a>
          ) : (
            <strong>{row.original.name}</strong>
          ),
      },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) =>
          formatCurrency(row.original.price, wishlist?.data.currency ?? "CAD"),
      },
      {
        id: "score",
        header: "Score",
        cell: ({ row }) => numericLabel(row.original.score),
      },
      {
        id: "ci",
        header: "Cost Index",
        cell: ({ row }) => costIndexLabel(row.original.costIndex),
      },
      { accessorKey: "retailer", header: "Retailer" },
      { accessorKey: "status", header: "Availability" },
      { accessorKey: "usefulParts", header: "Useful parts" },
      {
        id: "added",
        header: "Added",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [wishlist?.data.currency],
  );

  if (!wishlist) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Wishlist"
          description="Compare orderable listings by useful parts, score, Cost Index, and price."
        />
        <EmptyState
          title="Load your generated wishlist"
          description="The private wishlist stays in this browser."
          action={
            <FileUpload label="Load wishlist JSON" onFile={loadWishlist} />
          }
        />
      </div>
    );
  }

  const clearFilters = () =>
    setFilters({ parts: "", type: "", match: "any", onlyMissing: false });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Orderable shortlist"
        title="Wishlist"
        description="Filter down to the parts you need. Only missing excludes matches already marked as owned."
        actions={
          <div className="flex rounded-lg border border-border bg-card p-1">
            <Button
              type="button"
              size="sm"
              variant={view === "card" ? "default" : "ghost"}
              aria-pressed={view === "card"}
              onClick={() => setView("card")}
            >
              <Grid2X2 aria-hidden="true" />
              Cards
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "list" ? "default" : "ghost"}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List aria-hidden="true" />
              List
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto]">
        <label className="relative block">
          <span className="sr-only">Search wishlist</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search wishlist"
          />
        </label>
        <label>
          <span className="sr-only">Sort wishlist</span>
          <select
            className={selectClass}
            value={sort}
            onChange={(event) => setSort(event.target.value as WishlistSort)}
          >
            <option value="costIndex">Cost Index</option>
            <option value="score">Score</option>
            <option value="price">Price</option>
            <option value="createdAt">Newest added</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <fieldset className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(14rem,1fr)_auto_auto_auto_auto] lg:items-end">
        <legend className="px-2 text-sm font-extrabold">Part filters</legend>
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Part full name or abbreviation
          <Input
            list="wishlist-part-options"
            value={filters.parts}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                parts: event.target.value,
              }))
            }
            placeholder="e.g. LR, 7-60"
          />
          <datalist id="wishlist-part-options">
            {partNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Part type
          <select
            className={selectClass}
            value={filters.type}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type: event.target.value,
              }))
            }
          >
            <option value="">All types</option>
            <option value="blade">Main Blade</option>
            <option value="lockChip">Clip Lock</option>
            <option value="overBlade">Over Blade</option>
            <option value="assistBlade">Assist Blade</option>
            <option value="ratchet">Ratchet</option>
            <option value="bit">Bit</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Match
          <select
            className={selectClass}
            value={filters.match}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                match: event.target.value as "any" | "all",
              }))
            }
          >
            <option value="any">Any part</option>
            <option value="all">All parts</option>
          </select>
        </label>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={filters.onlyMissing}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                onlyMissing: event.target.checked,
              }))
            }
          />
          Only missing parts
        </label>
        <Button type="button" variant="ghost" onClick={clearFilters}>
          <X aria-hidden="true" />
          Clear filters
        </Button>
      </fieldset>

      <p className="text-sm font-bold text-muted-foreground">
        {items.length} of {sourceItems.length} items
      </p>

      {view === "card" ? (
        items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <WishlistCard
                key={item.url ?? `${item.name}-${index}`}
                item={item}
                currency={wishlist.data.currency ?? "CAD"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No wishlist matches"
            description="Clear or broaden the current search and part filters."
          />
        )
      ) : (
        <DataTable
          data={items}
          columns={columns}
          getRowId={(item, index) => item.url ?? `${item.name}-${index}`}
          empty={
            <EmptyState
              title="No wishlist matches"
              description="Clear or broaden the current search and part filters."
            />
          }
          mobileCard={(item) => (
            <WishlistCard
              item={item}
              currency={wishlist.data.currency ?? "CAD"}
            />
          )}
        />
      )}
    </div>
  );
}

function WishlistCard({
  item,
  currency,
}: {
  item: WishlistItem;
  currency: string;
}) {
  return (
    <ProductListingCard
      name={item.name}
      imageUrl={item.imageUrl}
      href={item.url}
      meta={
        <>
          {item.retailer ?? "-"} · {item.status ?? "-"}
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {formatCurrency(item.price, currency)}
        </Badge>
        <Badge>CI {costIndexLabel(item.costIndex)}</Badge>
        <Badge variant="outline">Score {numericLabel(item.score)}</Badge>
      </div>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        {item.usefulParts ?? "-"}
      </p>
      {item.createdAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Added {formatDate(item.createdAt)}
        </p>
      )}
    </ProductListingCard>
  );
}

function readView(): View {
  return localStorage.getItem(viewKey) === "list" ? "list" : "card";
}

function readFilters(): PartFilters {
  try {
    const value = JSON.parse(
      localStorage.getItem(filterKey) ?? "{}",
    ) as Partial<PartFilters>;
    return {
      parts: value.parts ?? "",
      type: value.type ?? "",
      match: value.match === "all" ? "all" : "any",
      onlyMissing: value.onlyMissing === true,
    };
  } catch {
    return { parts: "", type: "", match: "any", onlyMissing: false };
  }
}

function numericLabel(value: unknown): string {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "-";
}

function costIndexLabel(value: unknown): string {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `$${number}` : "-";
}
