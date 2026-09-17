/** Front-view module order in NVIDIA’s DGX GB200 hardware guide.
 * The two management switches sit above these shelves/trays and are separate.
 * https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html
 */
export const rackSlotKinds = [
  ...Array<string>(4).fill("power"), ...Array<string>(10).fill("compute"),
  ...Array<string>(9).fill("switch"), ...Array<string>(8).fill("compute"),
  ...Array<string>(4).fill("power"),
];

export function rackInventory(racks: number) {
  if (![1, 2, 4, 8].includes(racks)) throw new RangeError("Choose 1, 2, 4 or 8 reference racks");
  const count = (kind: string) => racks * rackSlotKinds.filter(slot => slot === kind).length;
  const computeTrays = count("compute"), switchTrays = count("switch");
  return { racks, computeTrays, switchTrays, powerShelves: count("power"), gpus: computeTrays * 4, cpus: computeTrays * 2, switchChips: switchTrays * 2 };
}
