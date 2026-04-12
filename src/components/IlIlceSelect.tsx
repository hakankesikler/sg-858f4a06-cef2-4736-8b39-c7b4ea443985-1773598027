import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ilIlceData } from "@/data/ilIlceData";
import { ChevronDown } from "lucide-react";

interface IlIlceSelectProps {
  ilValue: string;
  ilceValue: string;
  onIlChange: (value: string) => void;
  onIlceChange: (value: string) => void;
}

export function IlIlceSelect({ ilValue, ilceValue, onIlChange, onIlceChange }: IlIlceSelectProps) {
  const [ilSearch, setIlSearch] = useState("");
  const [ilceSearch, setIlceSearch] = useState("");
  const [ilOpen, setIlOpen] = useState(false);
  const [ilceOpen, setIlceOpen] = useState(false);

  const filteredIller = useMemo(() => {
    return ilIlceData.filter(item =>
      item.il.toLowerCase().includes(ilSearch.toLowerCase())
    );
  }, [ilSearch]);

  const ilceler = useMemo(() => {
    const selectedIl = ilIlceData.find(item => item.il === ilValue);
    return selectedIl?.ilceler || [];
  }, [ilValue]);

  const filteredIlceler = useMemo(() => {
    return ilceler.filter(ilce =>
      ilce.toLowerCase().includes(ilceSearch.toLowerCase())
    );
  }, [ilceler, ilceSearch]);

  // Reset ilçe when il changes
  useEffect(() => {
    if (ilValue) {
      const selectedIl = ilIlceData.find(item => item.il === ilValue);
      if (selectedIl && !selectedIl.ilceler.includes(ilceValue)) {
        onIlceChange("");
      }
    }
  }, [ilValue, ilceValue, onIlceChange]);

  const handleIlSelect = (il: string) => {
    onIlChange(il);
    setIlOpen(false);
    setIlSearch("");
  };

  const handleIlceSelect = (ilce: string) => {
    onIlceChange(ilce);
    setIlceOpen(false);
    setIlceSearch("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* İl Dropdown */}
      <div className="space-y-2 relative">
        <Label>İl</Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIlOpen(!ilOpen)}
            className="w-full px-3 py-2 text-left border rounded-md bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className={ilValue ? "" : "text-gray-400"}>
              {ilValue || "İl seçiniz"}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${ilOpen ? "rotate-180" : ""}`} />
          </button>

          {ilOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              <div className="p-2 border-b">
                <Input
                  type="text"
                  placeholder="İl ara..."
                  value={ilSearch}
                  onChange={(e) => setIlSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-1">
                  {filteredIller.map((item) => (
                    <button
                      key={item.il}
                      type="button"
                      onClick={() => handleIlSelect(item.il)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                        ilValue === item.il ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      {item.il}
                    </button>
                  ))}
                  {filteredIller.length === 0 && (
                    <div className="px-3 py-2 text-gray-400 text-sm">Sonuç bulunamadı</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* İlçe Dropdown */}
      <div className="space-y-2 relative">
        <Label>İlçe</Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (ilValue) {
                setIlceOpen(!ilceOpen);
              }
            }}
            disabled={!ilValue}
            className={`w-full px-3 py-2 text-left border rounded-md flex items-center justify-between ${
              !ilValue ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:bg-gray-50"
            }`}
          >
            <span className={ilceValue ? "" : "text-gray-400"}>
              {ilValue ? (ilceValue || "İlçe seçiniz") : "Önce il seçiniz"}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${ilceOpen ? "rotate-180" : ""}`} />
          </button>

          {ilceOpen && ilValue && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              <div className="p-2 border-b">
                <Input
                  type="text"
                  placeholder="İlçe ara..."
                  value={ilceSearch}
                  onChange={(e) => setIlceSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-1">
                  {filteredIlceler.map((ilce) => (
                    <button
                      key={ilce}
                      type="button"
                      onClick={() => handleIlceSelect(ilce)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                        ilceValue === ilce ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      {ilce}
                    </button>
                  ))}
                  {filteredIlceler.length === 0 && (
                    <div className="px-3 py-2 text-gray-400 text-sm">Sonuç bulunamadı</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}