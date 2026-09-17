import { test } from "node:test";
import assert from "node:assert/strict";
import { rackInventory, rackSlotKinds } from "../src/rack-layout.ts";

test("2D and 3D rack views share the reference component inventory", () => {
  assert.equal(rackSlotKinds.length, 35);
  assert.deepEqual(rackInventory(1), { racks: 1, computeTrays: 18, switchTrays: 9, powerShelves: 8, gpus: 72, cpus: 36, switchChips: 18 });
  assert.equal(rackInventory(8).gpus, 576);
  assert.equal(rackInventory(4).powerShelves, 32);
  for (const invalid of [0, -1, 1.5, 3, 9, NaN, Infinity]) assert.throws(() => rackInventory(invalid), RangeError);
});
