import { Badge } from "@/components/ui/badge";

type DataStatusProps = {
  label: string;
  value: string;
  state?: "idle" | "ready" | "warning" | "error";
};

const variants = {
  idle: "outline",
  ready: "success",
  warning: "warning",
  error: "destructive",
} as const;

export function DataStatus({ label, value, state = "idle" }: DataStatusProps) {
  return (
    <Badge variant={variants[state]}>
      <span className="text-muted-foreground">{label}:</span>
      {value}
    </Badge>
  );
}
