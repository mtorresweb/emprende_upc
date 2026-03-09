"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CoverPickerProps = {
  defaultUrl?: string;
};

export function CoverPicker({ defaultUrl }: CoverPickerProps) {
  const [_, setObjectUrl] = useState<string | null>(null);

  // Clean up generated object URLs when unmounting
  useEffect(() => {
    return () => {
      setObjectUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="cover">Imagen de portada (JPG, PNG, WEBP)</Label>
      <Input
        id="cover"
        name="cover"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        required
        onChange={(event) => {
          const file = event.target.files?.[0];
          setObjectUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />
      {defaultUrl && (
        // eslint-disable-next-line react/no-unescaped-entities
        <p className="text-xs text-muted-foreground">Portada actual cargada. Usa el botón "Ver portada" para verla.</p>
      )}
    </div>
  );
}
