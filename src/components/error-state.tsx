import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  message: string;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-destructive/25 bg-destructive/7 p-4 text-destructive",
        className,
      )}
      role="alert"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <h2 className="font-extrabold">{title}</h2>
        <p className="mt-1 text-sm leading-6">{message}</p>
      </div>
    </div>
  );
}
