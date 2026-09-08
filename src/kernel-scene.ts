import * as THREE from "three";
import { surfaceLabel, routedLine } from "./scene-detail";
import {
  getMatmulState,
  selectMatmulOutput,
  type MatmulState,
} from "./kernel-lab";

type Rig = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  frameObject: (
    object: THREE.Object3D,
    direction: [number, number, number],
    animated?: boolean,
  ) => void;
  animate: (onFrame?: (time: number) => void) => void;
};
type RigFactory = (
  container: HTMLElement,
  position: [number, number, number],
) => Rig;

export function createKernelScene(makeRig: RigFactory) {
  const container = document.getElementById("matmul-scene");
  if (!container) return;
  const fallback = container.querySelector<HTMLElement>(
    "[data-matmul-fallback]",
  )!;
  try {
    const rig = makeRig(container, [4, 17, 17]);
    rig.renderer.domElement.setAttribute(
      "aria-label",
      "Tiled matrix multiplication memory model. Use the output selector and numerical tables for an accessible equivalent.",
    );
    const root = new THREE.Group();
    rig.scene.add(root);
    let selectable: THREE.Mesh[] = [];
    let view = "oblique",
      lastShape = "";
    const directions: Record<string, [number, number, number]> = {
      oblique: [4, 17, 17],
      top: [0, 20, 2],
    };
    const cellSize = 0.69,
      pitch = 0.82;
    const dispose = () => {
      root.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if ("map" in material && material.map instanceof THREE.Texture)
              material.map.dispose();
            material.dispose();
          });
        }
      });
      root.clear();
      selectable = [];
    };
    const box = (
      width: number,
      height: number,
      depth: number,
      color: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.85,
          metalness: 0,
        }),
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
      return mesh;
    };
    const draw = (state: MatmulState) => {
      dispose();
      const { config: c, frame: f, step } = state;
      const grid = (
        title: string,
        rows: number,
        cols: number,
        x: number,
        y: number,
        z: number,
        value: (r: number, col: number) => number | null,
        color: (r: number, col: number) => number,
        output = false,
      ) => {
        const width = cols * pitch + 0.4,
          depth = rows * pitch + 0.7;
        const centerX = x + ((cols - 1) * pitch) / 2,
          centerZ = z + ((rows - 1) * pitch) / 2;
        box(width, 0.1, depth, 0xd9ded2, centerX, y - 0.12, centerZ - 0.12);
        root.add(
          surfaceLabel(title, Math.max(2.4, cols * pitch), [
            centerX,
            y + 0.02,
            z - 0.72,
          ]),
        );
        for (let r = 0; r < rows; r++)
          for (let col = 0; col < cols; col++) {
            const fill = color(r, col),
              v = value(r, col);
            const cell = box(
              cellSize,
              0.15,
              cellSize,
              fill,
              x + col * pitch,
              y,
              z + r * pitch,
            );
            if (output) {
              cell.userData.output = [r, col];
              selectable.push(cell);
            }
            const text = surfaceLabel(
              v === null ? "·" : String(v),
              0.48,
              [cell.position.x, y + 0.083, cell.position.z],
              fill === 0x2559d6 || fill === 0x304a38 ? "#ffffff" : "#293c31",
            );
            root.add(text);
          }
        return new THREE.Vector3(centerX, y + 0.24, centerZ);
      };
      const inA = (r: number, col: number) =>
        r >= f.rowStart &&
        r < f.rowStart + c.tile &&
        col >= f.kStart &&
        col < Math.min(c.k, f.kStart + c.tile);
      const inB = (r: number, col: number) =>
        r >= f.kStart &&
        r < Math.min(c.k, f.kStart + c.tile) &&
        col >= f.colStart &&
        col < f.colStart + c.tile;
      const sourceA = grid(
        "A / global memory",
        c.m,
        c.k,
        -7,
        1,
        -5,
        (r, col) => f.a[r][col],
        (r, col) =>
          step && inA(r, col) ? (r === c.row ? 0x2559d6 : 0xbbccf3) : 0xeef0e8,
      );
      const sourceB = grid(
        "B / global memory",
        c.k,
        c.n,
        0.3,
        1,
        -5,
        (r, col) => f.b[r][col],
        (r, col) =>
          step && inB(r, col)
            ? col === c.col
              ? 0x2559d6
              : 0xbbccf3
            : 0xeef0e8,
      );
      const sharedA = grid(
        "Shared A",
        c.tile,
        c.tile,
        -7,
        0,
        2,
        (r, col) => (step ? f.sharedA[r][col] : null),
        (r, col) =>
          !step
            ? 0xeef0e8
            : f.rowStart + r >= c.m || f.kStart + col >= c.k
              ? 0xe3dfd5
              : r === c.row - f.rowStart
                ? 0x2559d6
                : 0xbbccf3,
      );
      const sharedB = grid(
        "Shared B",
        c.tile,
        c.tile,
        -2.9,
        0,
        2,
        (r, col) => (step ? f.sharedB[r][col] : null),
        (r, col) =>
          !step
            ? 0xeef0e8
            : f.kStart + r >= c.k || f.colStart + col >= c.n
              ? 0xe3dfd5
              : col === c.col - f.colStart
                ? 0x2559d6
                : 0xbbccf3,
      );
      const isBlock = (r: number, col: number) =>
        r >= f.rowStart &&
        r < f.rowStart + c.tile &&
        col >= f.colStart &&
        col < f.colStart + c.tile;
      const output = grid(
        f.phase === "store" ? "C / global write" : "C / register partials",
        c.m,
        c.n,
        2.9,
        f.phase === "store" ? 1 : 0.3,
        2,
        (r, col) =>
          isBlock(r, col)
            ? f.accumulators[r - f.rowStart][col - f.colStart]
            : null,
        (r, col) =>
          r === c.row && col === c.col
            ? 0x2559d6
            : isBlock(r, col)
              ? 0x304a38
              : 0xeef0e8,
        true,
      );
      const connect = (
        from: THREE.Vector3,
        to: THREE.Vector3,
        active: boolean,
      ) => {
        const points: [number, number, number][] = [
          [from.x, from.y, from.z],
          [from.x, from.y + 0.6, to.z],
          [to.x, to.y + 0.5, to.z],
        ];
        root.add(routedLine(points, 0x2559d6, active ? 0.85 : 0.13));
      };
      connect(sourceA, sharedA, f.phase === "load");
      connect(sourceB, sharedB, f.phase === "load");
      connect(sharedA, output, f.phase === "accumulate");
      connect(sharedB, output, f.phase === "accumulate");
      root.add(
        surfaceLabel(
          "Selected output is blue / blank outputs belong to other blocks",
          12,
          [-0.4, -0.2, 6.0],
        ),
      );
      const shape = [c.m, c.n, c.k, c.tile].join(",");
      if (shape !== lastShape) {
        lastShape = shape;
        rig.frameObject(root, directions[view], false);
      }
    };
    document.addEventListener("atlas:matmulchange", (event) =>
      draw((event as CustomEvent<MatmulState>).detail),
    );
    document
      .querySelectorAll<HTMLButtonElement>("[data-matmul-view]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          view = button.dataset.matmulView!;
          document
            .querySelectorAll<HTMLButtonElement>("[data-matmul-view]")
            .forEach((b) => {
              b.classList.toggle("is-active", b === button);
              b.setAttribute("aria-pressed", String(b === button));
            });
          rig.frameObject(root, directions[view]);
        }),
      );
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let start: { x: number; y: number } | null = null;
    container.addEventListener("pointerdown", (e) => {
      start = { x: e.clientX, y: e.clientY };
    });
    container.addEventListener("pointerup", (e) => {
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) {
        start = null;
        return;
      }
      start = null;
      const rect = container.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, rig.camera);
      const hit = raycaster.intersectObjects(selectable, false)[0]?.object;
      if (hit?.userData.output)
        selectMatmulOutput(...(hit.userData.output as [number, number]));
    });
    fallback.hidden = true;
    draw(getMatmulState());
    rig.animate();
  } catch {
    fallback.hidden = false;
    fallback.textContent =
      "3D rendering is unavailable. The numerical tables below contain the same values and remain interactive.";
    document.querySelector<HTMLDetailsElement>(".matmul-tables")!.open = true;
  }
}
