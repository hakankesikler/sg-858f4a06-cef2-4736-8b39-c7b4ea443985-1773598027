import test from "node:test";
import assert from "node:assert/strict";
import { compareEquipment, calculatePlan, EQUIPMENT, expandPallets, validateGroups } from "../src/lib/loading-planner.ts";

const group = (overrides = {}) => ({ id:"g1",name:"Örnek",reference:"",description:"",widthCm:80,lengthCm:120,heightCm:100,quantity:2,grossKg:300,stackable:false,maxLayers:null,maxTopKg:null,stackScope:"same",allowRotate:true,...overrides });
const tiny = { ...EQUIPMENT[0],id:"test",lengthCm:240,widthCm:120,heightCm:210,openingWidthCm:120,openingHeightCm:200,payloadKg:1000 };

test("single-layer pallets receive distinct numbers and positions", () => {
  const result = calculatePlan(expandPallets([group()]), tiny);
  assert.equal(result.placed.length,2);
  assert.deepEqual(result.placed.map((p) => p.pallet.id),["P001","P002"]);
  assert.deepEqual(result.placed.map((p) => p.z),[0,0]);
  assert.notDeepEqual(result.placed.map((p) => [p.x,p.y])[0],result.placed.map((p) => [p.x,p.y])[1]);
});

test("known two-layer stack respects top load and height", () => {
  const result = calculatePlan(expandPallets([group({stackable:true,maxLayers:2,maxTopKg:300})]), tiny);
  assert.equal(result.placed.length,2);
  assert.deepEqual(result.placed.map((p) => p.z),[0,100]);
  assert.equal(result.floorUsedM2,.96);
});

test("unknown stacking capacity never creates a stack", () => {
  const result = calculatePlan(expandPallets([group({stackable:true,maxLayers:null,maxTopKg:null})]), tiny);
  assert.deepEqual(result.placed.map((p) => p.z),[0,0]);
  assert.match(result.issues.join(" "),/istiflenmedi/);
});

test("mixed-size upper pallet fits wholly within lower footprint", () => {
  const groups = [group({quantity:1,stackable:true,maxLayers:2,maxTopKg:500}),group({id:"g2",quantity:1,widthCm:60,lengthCm:100,grossKg:250,stackable:true,maxLayers:2,maxTopKg:250,stackScope:"mixed"})];
  groups[0].stackScope="mixed";
  const result = calculatePlan(expandPallets(groups),tiny);
  assert.equal(result.placed.length,2);
  assert.equal(result.placed.find((p) => p.pallet.id === "P002").layer,2);
});

test("opening and payload limits leave pallets explicitly outside", () => {
  const tooTall = calculatePlan(expandPallets([group({heightCm:201,quantity:1})]),tiny);
  assert.equal(tooTall.placed.length,0);
  assert.match(tooTall.issues.join(" "),/açıklığından/);
  const tooHeavy = calculatePlan(expandPallets([group({grossKg:600})]),tiny);
  assert.equal(tooHeavy.placed.length,1);
  assert.equal(tooHeavy.outside.length,1);
});

test("invalid input cannot silently become a valid plan", () => {
  assert.ok(validateGroups([group({quantity:1.5})]).length);
  assert.ok(validateGroups([group({widthCm:0})]).length);
  assert.ok(validateGroups([group({grossKg:-3})]).length);
  assert.ok(compareEquipment([group({quantity:0})],"FCL").errors.length);
});

test("comparison chooses full placement before smaller footprint", () => {
  const result = compareEquipment([group({quantity:20})],"FCL");
  assert.ok(result.recommended);
  assert.equal(result.recommended.outside.length,0);
});
