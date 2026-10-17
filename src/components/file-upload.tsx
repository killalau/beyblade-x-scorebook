import { Upload } from "lucide-react";
import { type ChangeEvent, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

type FileUploadProps = {
  label: string;
  onFile(file: File): Promise<void> | void;
};

export function FileUpload({ label, onFile }: FileUploadProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await onFile(file);
    event.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        <Upload aria-hidden="true" />
        {label}
      </Button>
    </>
  );
}
