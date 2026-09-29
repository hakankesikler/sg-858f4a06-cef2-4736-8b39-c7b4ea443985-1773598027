"use client";

import { useMemo, useRef, useState } from "react";
import type { Plan, Placement } from "@/lib/loading-planner";
import { Button } from "@/components/ui/button";

type Point3 = [number, number, number];
type Face = { key: string; points: string; depth: number; fill: string; pallet: Placement };
const COLORS = ["#ed7d31", "#3797ad", "#8167bf", "#87a936", "#d26570", "#5473bb"];

export function LoadingPlan3D({ plan, selectedId, onSelect }: { plan: Plan; selectedId: string | null; onSelect: (id: string) => void }) {
  const [azimuth, setAzimuth] = useState(-36);
  const [elevation, setElevation] = useState(27);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const { equipment, placed } = plan;
  const geometry = useMemo(() => {
    const a = azimuth * Math.PI / 180;
    const e = elevation * Math.PI / 180;
    const center: Point3 = [equipment.widthCm / 2, equipment.lengthCm / 2, equipment.heightCm / 3];
    const raw = ([x, y, z]: Point3) => {
      const dx = x - center[0], dy = y - center[1], dz = z - center[2];
      const rx = dx * Math.cos(a) - dy * Math.sin(a);
      const ry = dx * Math.sin(a) + dy * Math.cos(a);
      return { x:rx, y:ry * Math.sin(e) - dz * Math.cos(e), depth:ry * Math.cos(e) + dz * Math.sin(e) };
    };
    const boxVertices = (x: number, y: number, z: number, w: number, l: number, h: number): Point3[] => [
      [x,y,z],[x+w,y,z],[x+w,y+l,z],[x,y+l,z],
      [x,y,z+h],[x+w,y,z+h],[x+w,y+l,z+h],[x,y+l,z+h],
    ];
    const bounds = boxVertices(0,0,0,equipment.widthCm,equipment.lengthCm,equipment.heightCm).map(raw);
    const minX = Math.min(...bounds.map((v) => v.x)), maxX = Math.max(...bounds.map((v) => v.x));
    const minY = Math.min(...bounds.map((v) => v.y)), maxY = Math.max(...bounds.map((v) => v.y));
    const unit = Math.min(820 / (maxX-minX), 460 / (maxY-minY)) * zoom;
    const project = (point: Point3) => { const v = raw(point); return { x:450 + (v.x-(minX+maxX)/2)*unit, y:270 + (v.y-(minY+maxY)/2)*unit, depth:v.depth }; };
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    const equipmentPoints = boxVertices(0,0,0,equipment.widthCm,equipment.lengthCm,equipment.heightCm).map(project);
    const floor = [0,1,2,3].map((i) => `${equipmentPoints[i].x},${equipmentPoints[i].y}`).join(" ");
    const faces: Face[] = [];
    for (const item of placed) {
      const projected = boxVertices(item.x,item.y,item.z,item.widthCm,item.lengthCm,item.heightCm).map(project);
      const color = COLORS[item.pallet.number % COLORS.length];
      const faceDefs = [
        { ids:[0,1,2,3], shade:"#a0aab8" },
        { ids:[0,1,5,4], shade:color },
        { ids:[1,2,6,5], shade:color },
        { ids:[2,3,7,6], shade:color },
        { ids:[3,0,4,7], shade:color },
        { ids:[4,5,6,7], shade:color },
      ];
      faceDefs.forEach(({ ids, shade }, index) => {
        // Back-facing planes are omitted; the remaining faces are painter-sorted.
        const p = ids.map((i) => projected[i]);
        const area = p.reduce((sum, current, i) => { const next = p[(i+1)%p.length]; return sum + current.x * next.y - next.x * current.y; }, 0);
        if (area > 0 && index !== 5) return;
        faces.push({ key: `${item.pallet.id}-${index}`, points: p.map((v) => `${v.x},${v.y}`).join(" "), depth: p.reduce((sum, v) => sum + v.depth, 0)/p.length, fill: shade, pallet:item });
      });
    }
    faces.sort((left, right) => right.depth - left.depth);
    return { equipmentPoints, edges, floor, faces, project };
  }, [azimuth, elevation, zoom, equipment, placed]);

  return <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3 text-white sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="font-bold">Gerçek koordinatlardan 3D plan</h3><p className="text-xs text-slate-300">Sürükleyerek döndürün, tekerlek veya düğmelerle yakınlaştırın. Palete dokunun.</p></div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setZoom((value) => Math.max(.55,value-.15))} aria-label="Uzaklaştır">−</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setZoom((value) => Math.min(2.2,value+.15))} aria-label="Yakınlaştır">+</Button>
      </div>
    </div>
    <svg viewBox="0 0 900 540" role="img" aria-label={`${equipment.label} içinde ${placed.length} paletin 3 boyutlu yerleşimi`} className="w-full touch-none select-none rounded-xl bg-gradient-to-b from-slate-800 to-slate-950"
      onPointerDown={(event) => { drag.current = { x:event.clientX,y:event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { const previous = drag.current; if (!previous) return; setAzimuth((value) => value + (event.clientX-previous.x)*.45); setElevation((value) => Math.min(70,Math.max(8,value+(event.clientY-previous.y)*.25))); drag.current = {x:event.clientX,y:event.clientY}; }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.min(2.2,Math.max(.55,value+(event.deltaY<0?.1:-.1)))); }}>
      <polygon points={geometry.floor} fill="#314155" stroke="#fb923c" strokeWidth="2" />
      {geometry.faces.map((face) => <polygon key={face.key} points={face.points} fill={face.fill} fillOpacity={selectedId === face.pallet.pallet.id ? 1 : .87} stroke={selectedId === face.pallet.pallet.id ? "#fff" : "#182638"} strokeWidth={selectedId === face.pallet.pallet.id ? 3 : 1} className="cursor-pointer" onClick={(event) => { event.stopPropagation(); onSelect(face.pallet.pallet.id); }}><title>{`${face.pallet.pallet.id} · ${face.pallet.pallet.group.name} · Kat ${face.pallet.layer}`}</title></polygon>)}
      {geometry.edges.map(([a,b],i) => <line key={i} x1={geometry.equipmentPoints[a].x} y1={geometry.equipmentPoints[a].y} x2={geometry.equipmentPoints[b].x} y2={geometry.equipmentPoints[b].y} stroke="#fb923c" strokeWidth="1.5" strokeDasharray={i<4?undefined:"5 5"} opacity=".8" pointerEvents="none" />)}
    </svg>
    <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
      <label>Yatay açı <input type="range" min="-180" max="180" value={azimuth} onChange={(event) => setAzimuth(Number(event.target.value))} className="ml-2 align-middle" /></label>
      <label>Bakış açısı <input type="range" min="8" max="70" value={elevation} onChange={(event) => setElevation(Number(event.target.value))} className="ml-2 align-middle" /></label>
    </div>
  </div>;
}
