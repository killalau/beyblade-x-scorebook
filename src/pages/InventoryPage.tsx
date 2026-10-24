import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { EmptyState } from "@/components/empty-state";
import { FileUpload } from "@/components/file-upload";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InventoryPartDetail } from "@/domain/types";
import { inventoryPartImageRefs } from "@/features/inventory/part-images";
import { presentPartNames } from "@/features/inventory/part-name-presentation";
import {
  sortInventoryParts,
  type InventoryPartSort,
  type InventoryPartSortKey,
} from "@/features/inventory/part-sorting";
import { summarizeSources } from "@/features/inventory/source-summary";
import { usePrivateData } from "@/features/private-data/use-private-data";
import { groupInventoryParts } from "@/inventory-parts.js";

const categories = [
  "Blade",
  "Lock Chip",
  "Over Blade",
  "Assist Blade",
  "Ratchet",
  "Bit",
  "other",
] as const;
type DisplayCategory = (typeof categories)[number];

const labels: Record<DisplayCategory, string> = {
  Blade: "Blade / Main Blade",
  "Lock Chip": "Clip Lock",
  "Over Blade": "Over Blade",
  "Assist Blade": "Assist Blade",
  Ratchet: "Ratchet",
  Bit: "Bit",
  other: "Others",
};
const selectClass =
  "h-10 rounded-lg border border-input bg-card px-3 text-sm font-semibold text-foreground";
const preferredLineOrder = ["BX", "UX", "CX"];
const preferredBitTypeOrder = ["Attack", "Defense", "Stamina", "Balance"];

export function InventoryPage() {
  const { collection, loadCollection } = usePrivateData();
  const [category, setCategory] = useState<DisplayCategory>("Blade");
  const [query, setQuery] = useState("");
  const [lineFilter, setLineFilter] = useState("");
  const [bitTypeFilter, setBitTypeFilter] = useState("");
  const [sort, setSort] = useState<InventoryPartSort | null>(null);

  const groupedParts = useMemo(() => {
    if (!collection) return [];
    const details = (collection.data.inventory.partsDetail ??
      []) as unknown as InventoryPartDetail[];
    return groupInventoryParts(
      details
        .filter((part) => part.category !== "Complete Combo")
        .map((part) => ({
          ...part,
          imageRefs: inventoryPartImageRefs(part),
        })),
    );
  }, [collection]);

  const categoryParts = useMemo(
    () => groupedParts.filter((part) => partMatchesCategory(part, category)),
    [groupedParts, category],
  );
  const lineOptions = useMemo(
    () =>
      orderedUniqueValues(
        categoryParts.map((part) => part.line),
        preferredLineOrder,
      ),
    [categoryParts],
  );
  const bitTypeOptions = useMemo(
    () =>
      orderedUniqueValues(
        categoryParts.map((part) => part.type),
        preferredBitTypeOrder,
      ),
    [categoryParts],
  );
  const filteredParts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return categoryParts
      .filter(
        (part) =>
          category !== "Blade" || !lineFilter || part.line === lineFilter,
      )
      .filter(
        (part) =>
          category !== "Bit" || !bitTypeFilter || part.type === bitTypeFilter,
      )
      .filter(
        (part) =>
          !normalizedQuery ||
          [part.name, part.abbrev, ...(part.searchNames ?? [])].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedQuery),
          ),
      );
  }, [categoryParts, category, query, lineFilter, bitTypeFilter]);
  const displayedParts = useMemo(
    () => sortInventoryParts(filteredParts, sort),
    [filteredParts, sort],
  );
  const showLineColumn = category === "Blade";
  const showCategoryColumn = category === "other";
  const showTypeColumn = category === "Bit";
  const headers: InventoryTableHeader[] = [
    { label: "Image" },
    ...(showCategoryColumn ? [{ label: "Category" }] : []),
    ...(showLineColumn ? [{ label: "Line", sortKey: "line" as const }] : []),
    { label: "Part", sortKey: "name" },
    { label: "Abbrev.", sortKey: "abbrev" },
    ...(showTypeColumn ? [{ label: "Type", sortKey: "type" as const }] : []),
    { label: "Qty", sortKey: "qty" },
    { label: "Source" },
  ];

  const toggleSort = (key: InventoryPartSortKey) => {
    setSort((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  if (!collection) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Inventory"
          description="Browse currently owned parts without mixing in disposed products."
        />
        <EmptyState
          title="Load your collection"
          description="The private collection stays in this browser."
          action={
            <FileUpload label="Load collection JSON" onFile={loadCollection} />
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Owned parts"
        title="Inventory"
        description="Blade and Main Blade share one tab; stored categories and BX/UX/CX line data remain distinct."
      />

      <Tabs
        value={category}
        onValueChange={(value) => {
          setCategory(value as DisplayCategory);
          setSort(null);
        }}
      >
        <TabsList aria-label="Inventory part categories">
          {categories.map((value) => (
            <TabsTrigger key={value} value={value}>
              {labels[value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">Search part name or abbreviation</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search part name or abbreviation"
          />
        </label>
        {category === "Blade" && (
          <label>
            <span className="sr-only">Filter blades by line</span>
            <select
              className={selectClass}
              value={lineFilter}
              onChange={(event) => setLineFilter(event.target.value)}
            >
              <option value="">All Line</option>
              {lineOptions.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        )}
        {category === "Bit" && (
          <label>
            <span className="sr-only">Filter bits by type</span>
            <select
              className={selectClass}
              value={bitTypeFilter}
              onChange={(event) => setBitTypeFilter(event.target.value)}
            >
              <option value="">All Type</option>
              {bitTypeOptions.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        )}
        {query && (
          <Button type="button" variant="ghost" onClick={() => setQuery("")}>
            <X aria-hidden="true" />
            Clear search
          </Button>
        )}
        <p className="text-sm font-bold text-muted-foreground">
          {filteredParts.length} {labels[category]} parts
        </p>
      </div>

      {filteredParts.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted/70 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                {headers.map((header) => (
                  <InventoryColumnHeader
                    key={header.label}
                    header={header}
                    sort={sort}
                    onSort={toggleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedParts.map((part) => (
                <tr
                  key={`${part.category}-${part.name}-${part.abbrev}-${part.source}`}
                >
                  <td className="px-4 py-2">
                    <PartThumbnail part={part} />
                  </td>
                  {showCategoryColumn && (
                    <td className="px-4 py-3">{part.category ?? "-"}</td>
                  )}
                  {showLineColumn && (
                    <td className="px-4 py-3">
                      <InventoryLine part={part} />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <PartName part={part} />
                  </td>
                  <td className="px-4 py-3">{part.abbrev ?? "-"}</td>
                  {showTypeColumn && (
                    <td className="px-4 py-3">{part.type ?? "-"}</td>
                  )}
                  <td className="px-4 py-3">{part.qty ?? "-"}</td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">
                    <PartSources source={part.source} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No matching parts"
          description="Try another category or clear the current part search."
        />
      )}
    </div>
  );
}

interface InventoryTableHeader {
  label: string;
  sortKey?: InventoryPartSortKey;
}

function InventoryColumnHeader({
  header,
  onSort,
  sort,
}: {
  header: InventoryTableHeader;
  onSort: (key: InventoryPartSortKey) => void;
  sort: InventoryPartSort | null;
}) {
  const activeDirection =
    sort && sort.key === header.sortKey ? sort.direction : undefined;

  return (
    <th
      className="px-4 py-3 font-extrabold"
      aria-sort={header.sortKey ? activeDirection || "none" : undefined}
    >
      {header.sortKey ? (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Sort by ${header.label}`}
          onClick={() => onSort(header.sortKey!)}
        >
          {header.label}
          {activeDirection === "ascending" ? (
            <ArrowUp aria-hidden="true" className="size-3.5" />
          ) : activeDirection === "descending" ? (
            <ArrowDown aria-hidden="true" className="size-3.5" />
          ) : (
            <ArrowUpDown aria-hidden="true" className="size-3.5" />
          )}
        </button>
      ) : (
        header.label
      )}
    </th>
  );
}

function PartSources({ source }: { source?: string }) {
  const summary = summarizeSources(source);

  if (!summary.truncated) return summary.display;

  return <HoverTooltip content={summary.full}>{summary.display}</HoverTooltip>;
}

function PartName({ part }: { part: InventoryPartDetail }) {
  const presentation = presentPartNames(part);
  const displayedName = (
    <span className="grid gap-0.5 text-left">
      <span className="font-bold">{presentation.primary}</span>
      {presentation.secondary && (
        <span className="text-xs font-semibold text-muted-foreground">
          {presentation.secondary}
        </span>
      )}
    </span>
  );

  if (!presentation.alternates.length) return displayedName;

  return (
    <HoverTooltip
      content={
        <span className="grid gap-1">
          {presentation.alternates.map((name) => (
            <span key={name.label} className="block">
              <span className="font-extrabold">{name.label}:</span> {name.value}
            </span>
          ))}
        </span>
      }
    >
      {displayedName}
    </HoverTooltip>
  );
}

const lineTextClasses: Record<string, string> = {
  BX: "text-[#1479a7]",
  UX: "text-[#c2410c]",
  CX: "text-[#a21caf]",
};

function InventoryLine({ part }: { part: InventoryPartDetail }) {
  if (!part.line || part.line === "-") return "-";
  const isExpand = part.bladeSystem === "expand";
  return (
    <span
      className={`font-black ${lineTextClasses[part.line] ?? "text-foreground"}`}
      aria-label={`${part.line}${isExpand ? " Expand / Infinity" : ""}`}
      title={isExpand ? `${part.line} Expand / Infinity System` : undefined}
    >
      {part.line}
      {isExpand && <span aria-hidden="true">∞</span>}
    </span>
  );
}

function HoverTooltip({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const showTooltip = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 16;
    const gap = 8;
    const maxWidth = Math.min(384, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - maxWidth - viewportPadding,
    );
    const above = rect.bottom + 160 > window.innerHeight;
    setPosition({
      above,
      left,
      maxWidth,
      top: above ? rect.top - gap : rect.bottom + gap,
    });
  };

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-help underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-describedby={position ? tooltipId : undefined}
        tabIndex={0}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setPosition(null)}
        onFocus={showTooltip}
        onBlur={() => setPosition(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setPosition(null);
        }}
      >
        {children}
      </span>
      {position &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[100] rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed font-medium text-background shadow-xl"
            style={{
              left: position.left,
              maxWidth: position.maxWidth,
              top: position.top,
              transform: position.above ? "translateY(-100%)" : undefined,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

interface TooltipPosition {
  above: boolean;
  left: number;
  maxWidth: number;
  top: number;
}

function PartThumbnail({ part }: { part: InventoryPartDetail }) {
  const refs = part.imageRefs ?? [];
  const [failed, setFailed] = useState(false);
  if (!refs.length || failed) return <MissingPartThumbnail />;

  const ref = refs[0];
  const unknownVariant = refs.some((item) => item.variant === "unknown");
  return (
    <div className="relative w-fit">
      <a
        href={ref.detailUrl}
        target="_blank"
        rel="noreferrer"
        title={`View ${part.name} in the Beyblade parts database`}
      >
        <img
          src={ref.url}
          alt={`${part.name} part`}
          className="size-12 rounded-lg bg-white object-contain shadow-sm ring-1 ring-border transition hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </a>
      {unknownVariant && (
        <span
          className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow"
          title="Colour variant is not recorded; showing one candidate image"
          aria-label="Colour variant unknown"
        >
          ?
        </span>
      )}
    </div>
  );
}

function MissingPartThumbnail() {
  return (
    <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
      —
    </div>
  );
}

function partMatchesCategory(
  part: InventoryPartDetail,
  category: DisplayCategory,
): boolean {
  if (category === "Blade")
    return (
      part.category === "Blade" ||
      part.category === "Main Blade" ||
      part.category === "Metal Blade"
    );
  if (category !== "other") return part.category === category;
  return ![
    "Blade",
    "Lock Chip",
    "Main Blade",
    "Metal Blade",
    "Over Blade",
    "Assist Blade",
    "Ratchet",
    "Bit",
    "Complete Combo",
  ].includes(part.category);
}

function orderedUniqueValues(
  values: Array<string | undefined>,
  preferredOrder: string[],
): string[] {
  const observed = new Set(
    values.filter((value): value is string => Boolean(value) && value !== "-"),
  );
  const additional = [...observed]
    .filter((value) => !preferredOrder.includes(value))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return [...preferredOrder, ...additional];
}
