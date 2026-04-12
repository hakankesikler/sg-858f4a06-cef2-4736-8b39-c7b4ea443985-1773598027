import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { vergiDaireleri } from "@/data/vergiDaireleri";
import { Check } from "lucide-react";

interface VergiDairesiSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function VergiDairesiSelect({ value, onChange, placeholder = "Vergi dairesi seçiniz" }: VergiDairesiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredList = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return vergiDaireleri;
    
    return vergiDaireleri.filter(vd => 
      vd.name.toLowerCase().includes(query) || 
      vd.city.toLowerCase().includes(query) ||
      vd.code.includes(query)
    );
  }, [search]);

  const selectedVD = vergiDaireleri.find(vd => vd.name === value);

  return (
    <div className="relative">
      <div 
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {selectedVD ? selectedVD.name : placeholder}
        </span>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2 border-b">
            <Input
              placeholder="Vergi dairesi, il veya kod ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {filteredList.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Sonuç bulunamadı
                </div>
              ) : (
                filteredList.map((vd) => (
                  <div
                    key={vd.code}
                    className="flex items-center justify-between px-2 py-2 text-sm rounded-sm hover:bg-accent cursor-pointer"
                    onClick={() => {
                      onChange(vd.name);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{vd.name}</div>
                      <div className="text-xs text-muted-foreground">{vd.city} - {vd.code}</div>
                    </div>
                    {value === vd.name && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}