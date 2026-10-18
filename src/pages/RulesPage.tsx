import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  partTypeWeights,
  rankScores,
  rarityMultipliers,
} from "@/reference-data/scoringConfig.js";

export function RulesPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Shared public configuration"
        title="Scoring Rules"
        description="These values come directly from the same modules used by Scorebook and wishlist generation."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <RuleCard title="Rank scores" values={rankScores} />
        <RuleCard
          title="Part type weights"
          values={partTypeWeights}
          labels={{
            blade: "Blade / Main Blade",
            lockChip: "Clip Lock",
            overBlade: "Over Blade",
            assistBlade: "Assist Blade",
            ratchet: "Ratchet",
            bit: "Bit",
          }}
        />
        <RuleCard title="Rarity multipliers" values={rarityMultipliers} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Formulas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <Formula
            title="Part Score"
            formula="Rank Score × Part Type Weight"
            description="Measures the competitive value of each parsed part."
          />
          <Formula
            title="Cost Contribution"
            formula="Part Score × Rarity Multiplier"
            description="Owned parts contribute zero; rare missing parts are weighted more heavily."
          />
          <Formula
            title="Cost Index"
            formula="(Price ÷ Σ Cost Contribution) × 5"
            description="Lower is better: it means less money per weighted useful-part value."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Score measures the total ranked strength of all parsed parts. It
            does not decrease when a part is already owned.
          </p>
          <p>
            Cost Index focuses on acquisition value. Owned parts contribute zero
            to its denominator, while parts marked rare use the configured
            rarity multiplier.
          </p>
          <p>
            If no positive Cost Contribution remains, Cost Index is unavailable.
            Multipacks remain one product and combine every included
            configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RuleCard({
  title,
  values,
  labels = {},
}: {
  title: string;
  values: Record<string, number>;
  labels?: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {Object.entries(values).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
          >
            <span className="font-semibold">{labels[key] ?? key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Formula({
  title,
  formula,
  description,
}: {
  title: string;
  formula: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="font-extrabold">{title}</h2>
      <code className="mt-2 block rounded-lg bg-muted p-3 text-sm font-bold text-primary">
        {formula}
      </code>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
