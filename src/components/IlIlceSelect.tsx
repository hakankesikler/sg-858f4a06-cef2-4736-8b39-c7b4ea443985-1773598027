import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { ilIlceData } from "@/data/ilIlceData";

interface IlIlceSelectProps {
  ilValue: string;
  ilceValue: string;
  onIlChange: (value: string) => void;
  onIlceChange: (value: string) => void;
}

export function IlIlceSelect({ ilValue, ilceValue, onIlChange, onIlceChange }: IlIlceSelectProps) {
  const [ilOpen, setIlOpen] = useState(false);
  const [ilceOpen, setIlceOpen] = useState(false);
  const [ilSearch, setIlSearch] = useState("");
  const [ilceSearch, setIlceSearch] = useState("");

  const filteredIller = useMemo(() => {
    return ilIlceData.filter(il => 
      il.il.toLowerCase().includes(ilSearch.toLowerCase())
    );
  }, [ilSearch]);

  const selectedIlData = useMemo(() => {
    return ilIlceData.find(il => il.il === ilValue);
  }, [ilValue]);

  const filteredIlceler = useMemo(() => {
    if (!selectedIlData) return [];
    return selectedIlData.ilceler.filter(ilce =>
      ilce.toLowerCase().includes(ilceSearch.toLowerCase())
    );
  }, [selectedIlData, ilceSearch]);

  const handleIlSelect = (il: string) => {
    onIlChange(il);
    onIlceChange(""); // İl değişince ilçeyi sıfırla
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
      {/* İl Select */}
      <div className="space-y-2 relative">
        <div 
          className="flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer bg-white hover:bg-gray-50"
          onClick={() => setIlOpen(!ilOpen)}
        >
          <span className={ilValue ? "text-gray-900" : "text-gray-500"}>
            {ilValue || "İl seçiniz"}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${ilOpen ? "rotate-180" : ""}`} />
        </div>

        {ilOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="p-2 border-b">
              <Input
                placeholder="İl ara..."
                value={ilSearch}
                onChange={(e) => setIlSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-1">
                {filteredIller.map((il) => (
                  <div
                    key={il.il}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 rounded ${
                      ilValue === il.il ? "bg-gray-100 font-medium" : ""
                    }`}
                    onClick={() => handleIlSelect(il.il)}
                  >
                    {il.il}
                  </div>
                ))}
                {filteredIller.length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    Sonuç bulunamadı
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* İlçe Select */}
      <div className="space-y-2 relative">
        <div 
          className={`flex items-center justify-between w-full px-3 py-2 border rounded-md ${
            ilValue ? "cursor-pointer bg-white hover:bg-gray-50" : "cursor-not-allowed bg-gray-50"
          }`}
          onClick={() => ilValue && setIlceOpen(!ilceOpen)}
        >
          <span className={ilceValue ? "text-gray-900" : "text-gray-500"}>
            {ilceValue || (ilValue ? "İlçe seçiniz" : "Önce il seçiniz")}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${ilceOpen ? "rotate-180" : ""} ${!ilValue ? "opacity-50" : ""}`} />
        </div>

        {ilceOpen && ilValue && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="p-2 border-b">
              <Input
                placeholder="İlçe ara..."
                value={ilceSearch}
                onChange={(e) => setIlceSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-1">
                {filteredIlceler.map((ilce) => (
                  <div
                    key={ilce}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 rounded ${
                      ilceValue === ilce ? "bg-gray-100 font-medium" : ""
                    }`}
                    onClick={() => handleIlceSelect(ilce)}
                  >
                    {ilce}
                  </div>
                ))}
                {filteredIlceler.length === 0 && (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    Sonuç bulunamadı
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}