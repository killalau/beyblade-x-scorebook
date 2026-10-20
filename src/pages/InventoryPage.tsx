import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { FileUpload } from "@/components/file-upload";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InventoryPartDetail } from "@/domain/types";
import { inventoryPartImageRefs } from "@/features/inventory/part-images";
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

export function InventoryPage() {
  const { collection, loadCollection } = usePrivateData();
  const [category, setCategory] = useState<DisplayCategory>("Blade");
  const [query, setQuery] = useState("");

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

  const filteredParts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groupedParts
      .filter((part) => partMatchesCategory(part, category))
      .filter(
        (part) =>
          !normalizedQuery ||
          [part.name, part.abbrev].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedQuery),
          ),
      );
  }, [groupedParts, category, query]);

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
        onValueChange={(value) => setCategory(value as DisplayCategory)}
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
                {[
                  "Image",
                  "Category",
                  "Line",
                  "Part",
                  "Abbrev.",
                  "Qty",
                  "Source",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-extrabold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParts.map((part, index) => (
                <tr
                  key={`${part.category}-${part.name}-${part.abbrev}-${index}`}
                >
                  <td className="px-4 py-2">
                    <PartThumbnail part={part} />
                  </td>
                  <td className="px-4 py-3">{part.category ?? "-"}</td>
                  <td className="px-4 py-3">{part.line ?? "-"}</td>
                  <td className="px-4 py-3 font-bold">{part.name ?? "-"}</td>
                  <td className="px-4 py-3">{part.abbrev ?? "-"}</td>
                  <td className="px-4 py-3">{part.qty ?? "-"}</td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">
                    {part.source ?? "-"}
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

function PartThumbnail({ part }: { part: InventoryPartDetail }) {
  const refs = part.imageRefs ?? [];
  const [failed, setFailed] = useState(false);
  if (!refs.length || failed) return <MissingPartThumbnail />;

  const ref = refs[0];
  const unknownVariant = refs.some((item) => item.variant === "unknown");
  return (
    <div className="relative w-fit">
      <a
        href="https://beyblade.phstudy.org/index.html"
        target="_blank"
        rel="noreferrer"
        title="Image reference: beyblade.phstudy.org"
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
