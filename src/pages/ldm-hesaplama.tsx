"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TRAILER_WIDTH_M = 2.4;
const TRAILER_LENGTH_M = 13.6;
const ASSUMED_USABLE_HEIGHT_CM = 280;

type LoadRow = {
  id: number;
  quantity: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  stackable: boolean;
};

function parsePositive(value: string) {
  const normalized = value.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export default function LdmHesaplama() {
  const [loads, setLoads] = useState<LoadRow[]>([{ id: 1, quantity: "1", lengthCm: "120", widthCm: "80", heightCm: "100", stackable: false }]);

  const result = useMemo(() => {
    const rows = loads.map((load) => {
      const qty = Math.max(1, Math.floor(parsePositive(load.quantity) || 1));
      const length = parsePositive(load.lengthCm) / 100;
      const width = parsePositive(load.widthCm) / 100;
      const heightCm = parsePositive(load.heightCm);
      const stackLevels = load.stackable && heightCm > 0 ? Math.max(1, Math.floor(ASSUMED_USABLE_HEIGHT_CM / heightCm)) : 1;
      const floorPositions = Math.ceil(qty / stackLevels);
      const area = floorPositions * length * width;
      return { ...load, qty, heightCm, stackLevels, floorPositions, area, ldm: area / TRAILER_WIDTH_M };
    });
    const area = rows.reduce((sum, row) => sum + row.area, 0);
    const ldm = rows.reduce((sum, row) => sum + row.ldm, 0);
    return { rows, area, ldm, trailerShare: (ldm / TRAILER_LENGTH_M) * 100 };
  }, [loads]);

  const valid = result.area > 0;

  const updateTextField = (id: number, field: "quantity" | "lengthCm" | "widthCm" | "heightCm", value: string) => {
    setLoads((current) => current.map((load) => load.id === id ? { ...load, [field]: value } : load));
  };

  const updateStackable = (id: number, value: boolean) => {
    setLoads((current) => current.map((load) => load.id === id ? { ...load, stackable: value } : load));
  };
