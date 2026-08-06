import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileToBase64 } from "@/lib/api";

type Props = {
  value: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  aspect?: "wide" | "square";
  maxMb?: number;
};

export function ImageUpload({
  value,
  onChange,
  label = "Screenshot",
  aspect = "wide",
  maxMb = 3,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Image must be smaller than ${maxMb}MB`);
      return;
    }
    setBusy(true);
    try {
      onChange(await fileToBase64(file));
    } catch {
      toast.error("Could not read that image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-destructive"
            onClick={() => onChange(null)}
          >
            <Trash2 className="size-3.5" /> Remove
          </Button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40 transition-colors hover:border-primary ${
          aspect === "wide" ? "aspect-video" : "size-24 rounded-full"
        }`}
      >
        {value ? (
          <img src={value} alt={label} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 p-4 text-xs text-muted-foreground">
            <ImagePlus className="size-5" />
            {busy ? "Reading…" : "Click to upload"}
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
