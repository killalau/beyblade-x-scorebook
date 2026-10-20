export interface SourceSummary {
  display: string;
  full: string;
  truncated: boolean;
}

export function summarizeSources(
  source: string | undefined,
  limit = 3,
): SourceSummary {
  const sources = String(source ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  const full = sources.join("; ");
  const truncated = sources.length > limit;

  return {
    display: truncated
      ? `${sources.slice(0, limit).join("; ")}; ...`
      : full || "-",
    full: full || "-",
    truncated,
  };
}
