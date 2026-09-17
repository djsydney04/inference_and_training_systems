/** Functional grouping for the DGX GB200 reference, not mechanical rack positions. */
export const rackSlotKinds = Array.from({ length: 35 }, (_, slot) =>
  slot < 4 || slot > 30 ? "power" : (slot - 4) % 3 === 2 ? "switch" : "compute");

export function rackInventory(racks: number) {
  if (![1, 2, 4, 8].includes(racks)) throw new RangeError("Choose 1, 2, 4 or 8 reference racks");
  const count = (kind: string) => racks * rackSlotKinds.filter(slot => slot === kind).length;
  const computeTrays = count("compute"), switchTrays = count("switch");
  return { racks, computeTrays, switchTrays, powerShelves: count("power"), gpus: computeTrays * 4, cpus: computeTrays * 2, switchChips: switchTrays * 2 };
}
