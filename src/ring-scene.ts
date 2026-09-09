import * as THREE from "three";
import { surfaceLabel, routedLine } from "./scene-detail";
import { getRingState, selectRingRank, type RingState } from "./hardware-labs";
type Rig = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  frameObject: (
    object: THREE.Object3D,
    direction: [number, number, number],
    animated?: boolean,
  ) => void;
  animate: () => void;
};
type RigFactory = (
  container: HTMLElement,
  position: [number, number, number],
) => Rig;
export function createRingScene(makeRig: RigFactory) {
  const container = document.getElementById("ring-scene");
  if (!container) return;
  const fallback = container.querySelector<HTMLElement>(
    "[data-ring-fallback]",
  )!;
  try {
    const rig = makeRig(container, [3, 20, 18]),
      root = new THREE.Group();
    rig.scene.add(root);
    rig.renderer.domElement.setAttribute(
      "aria-label",
      "Logical all-reduce ring with four rank buffers. Use the rank selector and table for an accessible equivalent.",
    );
    const locations: [number, number][] = [
      [-4.3, -3.4],
      [4.3, -3.4],
      [4.3, 3.4],
      [-4.3, 3.4],
    ];
    const directions: Record<string, [number, number, number]> = {
      oblique: [3, 20, 18],
      top: [0, 22, 0.01],
    };
    let selectable: THREE.Mesh[] = [],
      first = true;
    const dispose = () => {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m: THREE.Material) => {
            if ("map" in m) (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          });
        }
      });
      root.clear();
      selectable = [];
    };
    const box = (
      w: number,
      h: number,
      d: number,
      color: number,
      x: number,
      y: number,
      z: number,
      r: number,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
      );
      mesh.position.set(x, y, z);
      mesh.userData.rank = r;
      root.add(mesh);
      selectable.push(mesh);
      return mesh;
    };
    const draw = ({ rank, frame: f }: RingState) => {
      dispose();
      locations.forEach(([x, z], r) => {
        box(5.5, 0.2, 4.45, r === rank ? 0x80948a : 0xc8cec5, x, -0.15, z, r);
        root.add(surfaceLabel(`RANK ${r}`, 2.5, [x, 0.04, z - 1.72]));
        f.buffers[r].forEach((chunk, c) => {
          const complete = chunk.contributors.length === 4,
            cz = z - 1.03 + c * 0.79;
          box(4.95, 0.14, 0.65, complete ? 0x2559d6 : 0xe5e8df, x, 0.05, cz, r);
          root.add(
            surfaceLabel(
              `C${c}   [${chunk.values.join(", ")}]   ${chunk.contributors.length}/4`,
              4.35,
              [x, 0.14, cz],
              complete ? "#ffffff" : "#293c31",
            ),
          );
        });
      });
      locations.forEach(([x, z], r) => {
        const [nx, nz] = locations[(r + 1) % 4];
        const horizontal = z === nz,
          sign = horizontal ? Math.sign(nx - x) : Math.sign(nz - z);
        const start = new THREE.Vector3(
          x + (horizontal ? sign * 2.85 : 0),
          0.28,
          z + (horizontal ? 0 : sign * 2.35),
        );
        const end = new THREE.Vector3(
          nx - (horizontal ? sign * 2.85 : 0),
          0.28,
          nz - (horizontal ? 0 : sign * 2.35),
        );
        const direction = end.clone().sub(start),
          length = direction.length();
        const arrow = new THREE.ArrowHelper(
          direction.normalize(),
          start,
          length,
          f.step ? 0x2559d6 : 0xa0aaa0,
          0.35,
          0.24,
        );
        root.add(arrow);
        const transfer = f.transfers.find((t) => t.from === r);
        const mx = (x + nx) / 2,
          mz = (z + nz) / 2;
        if (transfer) {
          const label = surfaceLabel(
            horizontal
              ? `C${transfer.chunk} / ${transfer.values.join(",")}`
              : `C${transfer.chunk}`,
            horizontal ? 2.7 : 0.65,
            [mx + (horizontal ? 0 : -0.7), 0.36, mz + (horizontal ? -0.62 : 0)],
          );
          root.add(label);
        }
      });
      root.add(
        surfaceLabel(
          f.step === 0
            ? "INITIAL BUFFERS"
            : `${f.phase.toUpperCase()} / ${f.step} OF 6`,
          5.8,
          [0, -0.03, 0],
        ),
      );
      root.add(
        routedLine(
          [
            [-1.8, -0.06, -0.6],
            [1.8, -0.06, -0.6],
          ],
          0x879b88,
          0.4,
        ),
      );
      if (first) {
        rig.frameObject(root, directions.oblique, false);
        first = false;
      }
    };
    document.addEventListener("atlas:ringchange", (e) =>
      draw((e as CustomEvent<RingState>).detail),
    );
    document
      .querySelectorAll<HTMLButtonElement>("[data-ring-view]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          document
            .querySelectorAll<HTMLButtonElement>("[data-ring-view]")
            .forEach((b) => {
              b.classList.toggle("is-active", b === button);
              b.setAttribute("aria-pressed", String(b === button));
            });
          rig.frameObject(root, directions[button.dataset.ringView!]);
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
      if (hit) selectRingRank(hit.userData.rank as number);
    });
    fallback.hidden = true;
    draw(getRingState());
    rig.animate();
  } catch {
    fallback.hidden = false;
    fallback.textContent =
      "3D rendering is unavailable. The rank selector, step controls and numerical buffer table remain fully interactive.";
  }
}
