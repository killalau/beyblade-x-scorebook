import { Calculator, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScoredProduct } from "@/domain/types";
import { usePrivateData } from "@/features/private-data/use-private-data";
import { sampleProducts } from "@/reference-data/index.js";
import { scoreProduct, summarizeBreakdown } from "@/scoring.js";

type ProductRow = { id: number; text: string; price: string; cxMode: boolean };
let nextRowId = 3;

const initialRows: ProductRow[] = [
  {
    id: 1,
    text: "Gill Shark 4-70O, Pearl Tiger 3-60U",
    price: "22.98",
    cxMode: false,
  },
  { id: 2, text: "Rage Ragna FE4-55Y", price: "19.99", cxMode: true },
];

export function ScorebookPage() {
  const { collection } = usePrivateData();
  const [rows, setRows] = useState(initialRows);
  const [rarePartsText, setRarePartsText] = useState("");
  const [selectedResult, setSelectedResult] = useState(0);

  const rareParts = useMemo(
    () =>
      rarePartsText
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    [rarePartsText],
  );
  const ownedParts = useMemo(
    () => (collection?.data.inventory.parts ?? []) as string[],
    [collection],
  );
  const results = useMemo(
    () =>
      rows
        .filter((row) => row.text.trim())
        .map((row) =>
          scoreProduct(
            {
              name: row.text,
              configs: row.text
                .split(",")
                .map((config) => config.trim())
                .filter(Boolean),
              price: row.price,
            },
            { ownedParts, rareParts, cxMode: row.cxMode },
          ),
        ),
    [rows, ownedParts, rareParts],
  );
  const activeIndex = Math.min(selectedResult, Math.max(results.length - 1, 0));
  const activeResult = results[activeIndex];

  function updateRow(id: number, patch: Partial<ProductRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(id: number) {
    setRows((current) =>
      current.length === 1
        ? [{ id: nextRowId++, text: "", price: "", cxMode: false }]
        : current.filter((row) => row.id !== id),
    );
    setSelectedResult(0);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
  }

  function loadSample(sample: (typeof sampleProducts)[number]) {
    setRows([
      {
        id: nextRowId++,
        text: sample.configs.join(", "),
        price: String(sample.price),
        cxMode: sample.cx === true,
      },
    ]);
    setSelectedResult(0);
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Ranked-parts calculator"
        title="Scorebook"
        description="Compare products using part rank, type weight, rarity, ownership, and tax-ready purchase price."
      />

      <form className="grid gap-4" onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {rows.map((row, index) => (
              <fieldset
                key={row.id}
                className="grid gap-3 rounded-xl border border-border p-3 md:grid-cols-[minmax(16rem,1fr)_9rem_auto_auto] md:items-end"
              >
                <legend className="sr-only">Product {index + 1}</legend>
                <label className="grid gap-1 text-xs font-bold text-muted-foreground">
                  Product or combo
                  <Input
                    value={row.text}
                    onChange={(event) =>
                      updateRow(row.id, { text: event.target.value })
                    }
                    placeholder="e.g. Keel Shark 3-60LF"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-muted-foreground">
                  Price
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(event) =>
                      updateRow(row.id, { price: event.target.value })
                    }
                    placeholder="0.00"
                  />
                </label>
                <label className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={row.cxMode}
                    onChange={(event) =>
                      updateRow(row.id, { cxMode: event.target.checked })
                    }
                  />
                  CX mode
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove product ${index + 1}`}
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </fieldset>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRows((current) => [
                    ...current,
                    { id: nextRowId++, text: "", price: "", cxMode: false },
                  ]);
                  setSelectedResult(results.length);
                }}
              >
                <Plus aria-hidden="true" />
                Add product
              </Button>
              <Button type="submit">
                <Calculator aria-hidden="true" />
                Calculate
              </Button>
            </div>
          </CardContent>
        </Card>

        <label className="grid gap-2 text-sm font-extrabold">
          Rare parts
          <Input
            value={rarePartsText}
            onChange={(event) => setRarePartsText(event.target.value)}
            placeholder="Comma-separated, e.g. Gill Shark, Rush"
          />
          <span className="text-xs font-normal text-muted-foreground">
            Rare parts receive the configured rarity multiplier unless already
            owned.
          </span>
        </label>
      </form>

      <section className="grid gap-4 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {results.length ? (
              results.map((result, index) => (
                <button
                  key={`${result.name}-${index}`}
                  type="button"
                  aria-pressed={activeIndex === index}
                  onClick={() => setSelectedResult(index)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm ${activeIndex === index ? "border-primary bg-secondary" : "border-border hover:bg-muted"}`}
                >
                  <span className="font-bold">{result.name}</span>
                  <span className="shrink-0 font-black">
                    {result.score} / {costIndexLabel(result.costIndex)}
                  </span>
                </button>
              ))
            ) : (
              <EmptyState
                title="No products to score"
                description="Enter a product or combo above."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        <ScoreBreakdown
          result={activeResult}
          ownedPartCount={ownedParts.length}
        />
      </section>

      <section className="grid gap-4" aria-labelledby="samples-title">
        <div>
          <h2 id="samples-title" className="text-2xl font-black">
            Saved public samples
          </h2>
          <p className="text-sm text-muted-foreground">
            Load a sample into the editor without using private data.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sampleProducts.map((sample) => {
            const result = scoreProduct(sample, {
              cxMode: sample.cx === true,
              ownedParts,
            });
            return (
              <button
                type="button"
                key={sample.name}
                onClick={() => loadSample(sample)}
                className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <span className="block font-extrabold">{sample.name}</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  Score {result.score} · CI {costIndexLabel(result.costIndex)}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ScoreBreakdown({
  result,
  ownedPartCount,
}: {
  result?: ScoredProduct;
  ownedPartCount: number;
}) {
  if (!result)
    return (
      <EmptyState
        title="No breakdown yet"
        description="A scored product's parsed parts and contributions appear here."
      />
    );
  const parts = summarizeBreakdown(result);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Score breakdown</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {parts.length} parsed parts · {ownedPartCount} owned part
              references
            </p>
          </div>
          <div className="flex gap-2">
            <Badge>Score {result.score}</Badge>
            <Badge variant="secondary">
              CI {costIndexLabel(result.costIndex)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                {[
                  "Part",
                  "Type",
                  "Rank",
                  "Part score",
                  "Rarity",
                  "Cost contribution",
                  "Source",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-2">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parts.map((part, index) => (
                <tr key={`${part.part}-${part.type}-${index}`}>
                  <td className="px-3 py-3 font-bold">{part.part}</td>
                  <td className="px-3 py-3">{typeLabel(part.type)}</td>
                  <td className="px-3 py-3">{part.rank}</td>
                  <td className="px-3 py-3">{part.score}</td>
                  <td className="px-3 py-3">{part.rarity}</td>
                  <td className="px-3 py-3">{part.costContribution}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {part.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function costIndexLabel(value: number | null): string {
  return value === null ? "-" : `$${value}`;
}

function typeLabel(type: string): string {
  return (
    (
      {
        blade: "Blade",
        ratchet: "Ratchet",
        bit: "Bit",
        lockChip: "Clip Lock",
        overBlade: "Over Blade",
        assistBlade: "Assist Blade",
      } as Record<string, string>
    )[type] ?? type
  );
}
