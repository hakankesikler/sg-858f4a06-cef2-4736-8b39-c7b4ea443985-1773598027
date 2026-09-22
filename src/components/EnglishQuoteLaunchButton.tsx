"use client";

import { Button } from "@/components/ui/button";

export function EnglishQuoteLaunchButton({ label = "Get a Quote" }: { label?: string }) {
  return <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" onClick={() => window.dispatchEvent(new Event("rex:open-english-quote-form"))}>{label}</Button>;
}
