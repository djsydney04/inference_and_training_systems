import * as THREE from "three";
import { createKernelScene } from "./kernel-scene";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  buildSM,
  surfaceLabel,
  routedLine,
  sequencePanel,
} from "./scene-detail";
import { fitCameraToBounds } from "./camera-fit";

type PartInfo = {
  eyebrow: string;
  title: string;
  body: string;
  facts: [string, string][];
};

type Selectable = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
const cameraMoves = new WeakMap<THREE.Camera, number>();

const colors = {
  ink: 0x242925,
  compute: 0x303632,
  computeLight: 0x66716a,
  memory: 0xaebbb4,
  memoryDark: 0x6f7c75,
  signal: 0x2559d6,
  signalPale: 0xb9caff,
  warm: 0xc97732,
  frame: 0x9b9c95,
  paper: 0xf4f1e8,
};

const boxMaterial = (color: number, roughness = 0.72, metalness = 0.08) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const makeBox = (
  width: number,
  height: number,
  depth: number,
  color: number,
  position: [number, number, number],
  name?: string,
  info?: PartInfo,
) => {
  const mesh: Selectable = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    boxMaterial(color),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  if (info) mesh.userData.info = info;
  mesh.userData.baseColor = color;
  return mesh;
};

function updateInspector(element: HTMLElement | null, info: PartInfo) {
  if (!element) return;
  element.innerHTML = `
    <span>${info.eyebrow}</span>
    <h3>${info.title}</h3>
    <p>${info.body}</p>
    <dl>${info.facts.map(([term, detail]) => `<div><dt>${term}</dt><dd>${detail}</dd></div>`).join("")}</dl>
  `;
}

function createSceneRig(
  container: HTMLElement,
  cameraPosition: [number, number, number],
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  camera.position.set(...cameraPosition);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute(
    "aria-label",
    "Conceptual 3D cutaway. Use the component selector for descriptions.",
  );
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 45;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x77756f, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(8, 12, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const blue = new THREE.DirectionalLight(colors.signalPale, 1.8);
  blue.position.set(-7, 1, -6);
  scene.add(blue);

  let visible = true;
  new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
    },
    { rootMargin: "200px" },
  ).observe(container);

  let framedObject: THREE.Object3D | null = null;
  const fitFrame = (
    direction = camera.position.clone().sub(controls.target),
    animated = false,
  ) => {
    if (!framedObject) return;
    const frame = fitCameraToBounds(
      new THREE.Box3().setFromObject(framedObject),
      direction,
      camera.fov,
      camera.aspect,
    );
    controls.maxDistance = Math.max(45, frame.distance * 1.8);
    animateCamera(camera, controls, frame.position, frame.target, animated);
  };
  const frameObject = (
    object: THREE.Object3D,
    direction: [number, number, number],
    animated = true,
  ) => {
    framedObject = object;
    fitFrame(new THREE.Vector3(...direction), animated);
  };

  const resize = () => {
    if (!container.clientWidth || !container.clientHeight) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitFrame();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  const animate = (onFrame?: (time: number) => void) => {
    const frame = (time: number) => {
      requestAnimationFrame(frame);
      if (!visible || document.hidden || !container.clientWidth) return;
      controls.update();
      onFrame?.(time);
      renderer.render(scene, camera);
    };
    requestAnimationFrame(frame);
  };

  return { scene, camera, renderer, controls, animate, frameObject };
}

function bindSelection(
  container: HTMLElement,
  camera: THREE.Camera,
  selectable: Selectable[],
  inspector: HTMLElement | null,
) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected: Selectable | null = null;
  let pointerStart: { x: number; y: number } | null = null;
  const isVisible = (mesh: Selectable) => {
    let object: THREE.Object3D | null = mesh;
    while (object) {
      if (!object.visible) return false;
      object = object.parent;
    }
    return true;
  };
  const label = document.createElement("label");
  label.className = "scene-part-picker";
  label.textContent = "Explore a component";
  const picker = document.createElement("select");
  picker.setAttribute(
    "aria-label",
    `Select a component in ${container.id.replace("-scene", "")}`,
  );
  label.append(picker);
  container.append(label);

  const resetColor = (mesh: Selectable) => {
    mesh.material.emissive.setHex(0x000000);
    mesh.material.emissiveIntensity = 0;
  };

  const selectPart = (hit: Selectable) => {
    if (selected) resetColor(selected);
    selected = hit;
    hit.material.emissive.setHex(colors.signal);
    hit.material.emissiveIntensity = 0.34;
    const info = hit.userData.info as PartInfo;
    updateInspector(inspector, info);
    // Multiple physical instances share one semantic entry in the picker.
    const option = Array.from(picker.options).find(
      (item) => item.text === info.title,
    );
    if (option) picker.value = option.value;
  };
  const refreshPicker = () => {
    picker.replaceChildren(new Option("Choose a part…", ""));
    const titles = new Set<string>();
    selectable.forEach((mesh, index) => {
      if (!mesh.userData.info || !isVisible(mesh)) return;
      const title = (mesh.userData.info as PartInfo).title;
      if (!titles.has(title)) {
        picker.add(new Option(title, String(index)));
        titles.add(title);
      }
    });
    if (selected && !isVisible(selected)) {
      resetColor(selected);
      selected = null;
    }
    // Keep the inspector and the visible view in agreement after a cutaway switch.
    const firstVisible = selectable.find(
      (mesh) => mesh.userData.info && isVisible(mesh),
    );
    if (selected) selectPart(selected);
    else if (firstVisible) selectPart(firstVisible);
  };
  picker.addEventListener("change", () => {
    if (picker.value !== "") {
      container.dispatchEvent(new Event("atlas:componentinspect"));
      selectPart(selectable[Number(picker.value)]);
    }
  });
  label.addEventListener("pointerdown", (event) => event.stopPropagation());
  label.addEventListener("pointerup", (event) => event.stopPropagation());
  container.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  container.addEventListener("pointerup", (event) => {
    if (
      !pointerStart ||
      Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
      ) > 5
    )
      return;
    pointerStart = null;
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(
      selectable.filter(isVisible),
      false,
    )[0]?.object as Selectable | undefined;
    if (!hit?.userData.info) return;
    container.dispatchEvent(new Event("atlas:componentinspect"));
    selectPart(hit);
  });

  container.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    container.style.cursor = raycaster.intersectObjects(
      selectable.filter(isVisible),
      false,
    ).length
      ? "pointer"
      : "grab";
  });
  refreshPicker();
  return Object.assign(refreshPicker, {
    selectByTitle: (title: string) => {
      const part = selectable.find(
        (mesh) =>
          isVisible(mesh) &&
          (mesh.userData.info as PartInfo)?.title.startsWith(title),
      );
      if (part) selectPart(part);
    },
  });
}

function animateCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  destination: THREE.Vector3,
  target: THREE.Vector3,
  animated = true,
) {
  const move = (cameraMoves.get(camera) ?? 0) + 1;
  cameraMoves.set(camera, move);
  if (
    !animated ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    camera.position.copy(destination);
    controls.target.copy(target);
    controls.update();
    return;
  }
  const start = camera.position.clone();
  const startTarget = controls.target.clone();
  const started = performance.now();
  const duration = 650;
  const step = (now: number) => {
    if (cameraMoves.get(camera) !== move) return;
    const t = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - t) ** 3;
    camera.position.lerpVectors(start, destination, eased);
    controls.target.lerpVectors(startTarget, target, eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function createGPUScene() {
  const container = document.getElementById("gpu-scene");
  const fallback = document.querySelector<HTMLElement>("[data-webgl-fallback]");
  if (!container) return;
  try {
    const rig = createSceneRig(container, [13, 12, 16.5]);
    rig.controls.target.set(0, 0, 0);
    rig.controls.minDistance = 6;
    rig.controls.maxDistance = 35;
    const packageGroup = new THREE.Group();
    const smDesign = buildSM();
    const smDetail = smDesign.group;
    smDetail.visible = false;
    rig.scene.add(packageGroup, smDetail);
    const selectable: Selectable[] = [...smDesign.selectable];

    const substrate = makeBox(
      11.6,
      0.36,
      8.2,
      0x6c746e,
      [0, -0.4, 0],
      "substrate",
      {
        eyebrow: "Selected / package",
        title: "Package substrate and interposer",
        body: "Dense wiring connects the compute dies to adjacent HBM stacks. Physical placement shortens the wide memory interface that would be impractical through a conventional socket.",
        facts: [
          ["Job", "power + high-density signals"],
          ["System effect", "memory bandwidth begins in packaging"],
        ],
      },
    );
    packageGroup.add(substrate);
    selectable.push(substrate);

    const logic = makeBox(
      5.5,
      0.72,
      5.25,
      colors.compute,
      [0, 0.2, 0],
      "logic-die",
      {
        eyebrow: "Selected / compute",
        title: "GPU compute die",
        body: "Graphics processing clusters contain many streaming multiprocessors around a shared L2, memory partitions, copy engines, and high-speed interfaces.",
        facts: [
          ["Inside", "GPC → TPC → SM"],
          ["Shared resources", "L2 + memory controllers"],
        ],
      },
    );
    packageGroup.add(logic);
    selectable.push(logic);

    const l2 = makeBox(
      1.15,
      0.2,
      4.75,
      colors.signal,
      [0, 0.67, 0],
      "l2-cache",
      {
        eyebrow: "Selected / memory hierarchy",
        title: "Shared L2 cache",
        body: "All SMs and copy paths share the device L2. It captures cross-block reuse, combines traffic, and sits between on-SM storage and HBM partitions.",
        facts: [
          ["Scope", "whole GPU"],
          ["Question", "hit rate under the real access pattern"],
        ],
      },
    );
    packageGroup.add(l2);
    selectable.push(l2);

    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = -2.35 + column * 0.67;
        const z = -2.2 + row * 0.88;
        if (Math.abs(x) < 0.75) continue;
        const sm = makeBox(
          0.49,
          0.13,
          0.64,
          colors.computeLight,
          [x, 0.67, z],
          "sm",
          {
            eyebrow: "Selected / execution",
            title: "Streaming multiprocessor",
            body: "An SM keeps many warps resident, allocates their registers and shared memory, schedules ready instructions, and dispatches scalar, tensor, load/store, and special-function pipelines.",
            facts: [
              ["Scheduling unit", "warp (32 threads)"],
              ["Fast storage", "register file + shared SRAM"],
            ],
          },
        );
        packageGroup.add(sm);
        selectable.push(sm);
      }
    }

    const hbmPositions: [number, number, number][] = [
      [-4.55, 0.22, -2.65],
      [-4.55, 0.22, 0],
      [-4.55, 0.22, 2.65],
      [4.55, 0.22, -2.65],
      [4.55, 0.22, 0],
      [4.55, 0.22, 2.65],
      [0, 0.22, -3.45],
      [0, 0.22, 3.45],
    ];
    hbmPositions.forEach((position, index) => {
      const hbm = makeBox(
        1.55,
        0.9,
        1.55,
        colors.memory,
        position,
        `hbm-${index}`,
        {
          eyebrow: "Selected / off-die memory",
          title: "High-bandwidth memory stack",
          body: "Vertically stacked DRAM dies connect through a very wide interface. HBM supplies far more bandwidth than socketed memory, but every avoidable round trip still costs energy and time.",
          facts: [
            ["Stores", "weights, KV cache, activations"],
            ["Optimization", "reuse in registers / shared SRAM"],
          ],
        },
      );
      packageGroup.add(hbm);
      selectable.push(hbm);
      // Visible lamination helps distinguish a DRAM stack from a compute tile.
      for (let layer = 0; layer < 6; layer += 1) {
        const lamina = makeBox(1.57, 0.035, 1.57, colors.memoryDark, [
          position[0],
          position[1] - 0.32 + layer * 0.125,
          position[2],
        ]);
        packageGroup.add(lamina);
      }
      packageGroup.add(
        surfaceLabel("HBM", 1.35, [position[0], 0.7, position[2]]),
      );
      for (let wire = 0; wire < 4; wire++) {
        const offset = (wire - 1.5) * 0.12;
        const endX = Math.max(-2.7, Math.min(2.7, position[0]));
        packageGroup.add(
          routedLine(
            [
              [position[0], -0.16, position[2] + offset],
              [endX, -0.16, position[2] + offset],
              [
                endX,
                -0.16,
                Math.max(-2.6, Math.min(2.6, position[2] + offset)),
              ],
            ],
            colors.signal,
            0.5,
          ),
        );
      }
    });
    packageGroup.add(
      surfaceLabel("Compute / clusters of SMs", 4.6, [0, 0.85, -1.55]),
    );
    packageGroup.add(surfaceLabel("L2", 1.05, [0, 0.85, 1.8]));
    packageGroup.add(
      surfaceLabel("Interposer / wide memory interfaces", 8, [0, -0.2, 4.8]),
    );

    for (let index = 0; index < 8; index += 1) {
      const port = makeBox(
        0.34,
        0.35,
        0.7,
        colors.signal,
        [-3.85 + index * 1.1, -0.05, 4.0],
        `nvlink-${index}`,
        {
          eyebrow: "Selected / scale-up fabric",
          title: "NVLink interface",
          body: "High-speed links carry GPU memory traffic toward peer GPUs through NVSwitch. The interface is distinct from HBM channels and from the scale-out network adapter.",
          facts: [
            ["Scope", "GPU-to-GPU load/store fabric"],
            ["GB200 generation", "18 links per B200 GPU"],
          ],
        },
      );
      packageGroup.add(port);
      selectable.push(port);
    }

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(35, 35),
      new THREE.ShadowMaterial({ opacity: 0.09 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.61;
    floor.receiveShadow = true;
    rig.scene.add(floor);

    const refreshSelection = bindSelection(
      container,
      rig.camera,
      selectable,
      document.getElementById("gpu-inspector"),
    );
    let currentView = "package";
    const setView = (view: string) => {
      currentView = view;
      document
        .querySelectorAll<HTMLButtonElement>("[data-gpu-view]")
        .forEach((button) => {
          button.classList.toggle("is-active", button.dataset.gpuView === view);
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.gpuView === view),
          );
        });
      packageGroup.visible = view !== "sm";
      smDetail.visible = view === "sm";
      refreshSelection();
      if (view === "package") rig.frameObject(packageGroup, [13, 12, 16.5]);
      if (view === "die") rig.frameObject(logic, [3.8, 8.4, 4.6]);
      if (view === "sm") rig.frameObject(smDetail, [5, 15, 12]);
    };
    const host = container.closest<HTMLElement>(".three-lab")!;
    const toolbar = document.createElement("div");
    toolbar.className = "model-options";
    toolbar.innerHTML =
      '<label><input type="checkbox" data-sm-labels checked /> SM labels</label><label>Separate SM layers <input type="range" data-sm-explode min="0" max="1" step="0.05" value="0" /></label><a href="https://docs.nvidia.com/cuda/blackwell-tuning-guide/index.html" target="_blank" rel="noreferrer">Blackwell guide</a><a href="https://docs.nvidia.com/cutlass/4.5.2/media/docs/pythonDSL/mma_docs/tcgen05_programming.html" target="_blank" rel="noreferrer">Tensor Memory reference</a>';
    host.querySelector(".three-stage")!.before(toolbar);
    toolbar
      .querySelector<HTMLInputElement>("[data-sm-labels]")!
      .addEventListener("change", (e) => {
        smDesign.labels.visible = (e.target as HTMLInputElement).checked;
      });
    toolbar
      .querySelector<HTMLInputElement>("[data-sm-explode]")!
      .addEventListener("input", (e) => {
        smDesign.setExploded(Number((e.target as HTMLInputElement).value));
        if (currentView !== "sm") setView("sm");
      });
    const sequence = sequencePanel(
      host,
      "Follow a tiled matrix operation",
      [
        {
          label: "Stage operands",
          title: "Bring reusable A and B tiles close to execution",
          body: "A block stages operand tiles in shared SRAM. Modern asynchronous copy paths can move global-memory data without a thread register round trip. The two rows represent staging, not an exact physical bank layout.",
        },
        {
          label: "Check readiness",
          title: "Work cannot issue before its dependencies are ready",
          body: "Barriers coordinate cooperative staging; a scoreboard tracks instruction dependencies. A scheduler can choose another eligible warp, but cannot remove a true producer–consumer dependency.",
        },
        {
          label: "Execute MMA",
          title: "Reuse each operand across multiple output elements",
          body: "Tensor instructions compute matrix multiply-accumulate operations. The blue tile cells are a conceptual operand/output tile, not individually addressable tensor cores. Shape, dtype and data layout must match the instruction contract.",
        },
        {
          label: "Keep partial sums",
          title: "Accumulate, apply the epilogue, then store the result",
          body: "Partial outputs survive reduction steps in instruction-specific accumulator storage. Register-fragment and Blackwell Tensor Memory paths differ. A final epilogue may apply scaling, bias or activation before the output is written.",
        },
      ],
      (step) => {
        if (step >= 0) {
          if (currentView !== "sm") setView("sm");
          refreshSelection.selectByTitle(
            ["Shared SRAM", "Warp scheduler", "Matrix multiply", "Accumulator"][
              step
            ],
          );
        }
        smDesign.setStage(step);
      },
    );
    container.addEventListener("atlas:componentinspect", sequence.reset);
    rig.frameObject(packageGroup, [13, 12, 16.5], false);
    document
      .querySelectorAll<HTMLButtonElement>("[data-gpu-view]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          sequence.reset();
          setView(button.dataset.gpuView ?? "package");
        }),
      );
    document
      .querySelector<HTMLButtonElement>("[data-gpu-reset]")
      ?.addEventListener("click", () => {
        sequence.reset();
        setView("package");
      });
    rig.animate((time) => {
      if (smDetail.visible) smDesign.animate(time);
    });
  } catch {
    fallback?.removeAttribute("hidden");
  }
}

function createRackScene() {
  const container = document.getElementById("rack-scene");
  if (!container) return;
  try {
    const rig = createSceneRig(container, [11, 7, 23]);
    rig.controls.target.set(0, 1.8, 0);
    rig.controls.minDistance = 10;
    rig.controls.maxDistance = 38;
    const rackGroup = new THREE.Group();
    const computeDetail = new THREE.Group();
    computeDetail.visible = false;
    rig.scene.add(rackGroup, computeDetail);
    const selectable: Selectable[] = [];
    const inspector = document.getElementById("rack-inspector");

    const leftRail = makeBox(0.22, 13.2, 4.5, colors.frame, [-3.65, 2.2, 0]);
    const rightRail = makeBox(0.22, 13.2, 4.5, colors.frame, [3.65, 2.2, 0]);
    const topRail = makeBox(7.5, 0.22, 4.5, colors.frame, [0, 8.8, 0]);
    const bottomRail = makeBox(7.5, 0.22, 4.5, colors.frame, [0, -4.4, 0]);
    rackGroup.add(leftRail, rightRail, topRail, bottomRail);

    let computeIndex = 0;
    let switchIndex = 0;
    const computePositions: number[] = [];
    const switchPositions: number[] = [];
    const slotCount = 31;
    for (let slot = 0; slot < slotCount; slot += 1) {
      const y = -3.78 + slot * 0.41;
      const isSwitch = [2, 5, 8, 12, 15, 18, 22, 25, 28].includes(slot);
      const isPower = slot === 0 || slot === 30 || slot === 29 || slot === 1;
      if (isPower) {
        const shelf = makeBox(
          6.9,
          0.31,
          3.9,
          colors.warm,
          [0, y, 0],
          `power-${slot}`,
          {
            eyebrow: "Selected / rack infrastructure",
            title: "Power and cooling infrastructure",
            body: "Power shelves feed a high-current bus bar. Liquid manifolds route coolant to cold plates on the Grace CPUs, Blackwell GPUs, and NVSwitch ASICs; controls and leak detection remain separate concerns.",
            facts: [
              ["Purpose", "dense power delivery"],
              ["Thermal path", "cold plate → facility water loop"],
            ],
          },
        );
        rackGroup.add(shelf);
        selectable.push(shelf);
      } else if (isSwitch) {
        switchPositions.push(y);
        const index = switchIndex++;
        const tray = makeBox(
          6.9,
          0.31,
          3.9,
          colors.signal,
          [0, y, 0],
          `switch-${index}`,
          {
            eyebrow: `Selected / NVLink switch tray ${index + 1}`,
            title: "NVLink switch tray",
            body: "Each of nine 1RU trays contains two NVSwitch ASICs. Across the rack, the eighteen switch chips form a non-blocking scale-up fabric for seventy-two GPUs.",
            facts: [
              ["Per tray", "2 NVSwitch ASICs"],
              ["GPU relation", "one link from every GPU to each switch"],
            ],
          },
        );
        rackGroup.add(tray);
        selectable.push(tray);
      } else {
        computePositions.push(y);
        const index = computeIndex++;
        const tray = makeBox(
          6.9,
          0.31,
          3.9,
          colors.compute,
          [0, y, 0],
          `compute-${index}`,
          {
            eyebrow: `Selected / compute tray ${index + 1}`,
            title: "Grace–Blackwell compute tray",
            body: "One tray contains two Grace CPUs and four B200 GPUs—two GB200 Superchips—plus networking, local storage, management, power conversion, and cold plates.",
            facts: [
              ["Rack count", "18 trays"],
              ["Per tray", "2 Grace + 4 B200"],
            ],
          },
        );
        rackGroup.add(tray);
        selectable.push(tray);
      }
      if (!isPower) {
        for (let port = 0; port < (isSwitch ? 8 : 4); port++) {
          const jack = makeBox(
            0.32,
            0.13,
            0.1,
            isSwitch ? colors.signalPale : colors.memory,
            [-2.8 + port * 0.68, y, 2.0],
          );
          jack.name = isSwitch ? "switch-port" : "tray-port";
          rackGroup.add(jack);
        }
      }
    }

    const busbar = makeBox(
      0.45,
      12.5,
      0.32,
      colors.warm,
      [3.2, 2.2, -2.15],
      "busbar",
      {
        eyebrow: "Selected / power plane",
        title: "Rack bus bar",
        body: "A low-voltage, high-current distribution spine connects power shelves to trays. At rack density, electrical delivery and conversion are first-order system design constraints.",
        facts: [
          ["Carries", "rack DC power"],
          ["Constraint", "current, loss, redundancy"],
        ],
      },
    );
    rackGroup.add(busbar);
    selectable.push(busbar);

    const manifoldA = makeBox(
      0.25,
      12.5,
      0.25,
      0x4b74bd,
      [-3.15, 2.2, -2.2],
      "cooling-supply",
      {
        eyebrow: "Selected / thermal plane",
        title: "Liquid cooling manifold",
        body: "Supply and return manifolds deliver coolant to tray cold plates. Flow rate, temperature, pressure, leak detection, and service isolation affect sustainable performance.",
        facts: [
          ["Cools", "GPU, CPU, NVSwitch cold plates"],
          ["Why", "rack heat flux exceeds practical air cooling"],
        ],
      },
    );
    const manifoldB = manifoldA.clone() as Selectable;
    manifoldB.position.x = -2.7;
    manifoldB.userData = { ...manifoldA.userData };
    rackGroup.add(manifoldA, manifoldB);
    selectable.push(manifoldA, manifoldB);

    const fabricRoutes = new THREE.Group();
    fabricRoutes.visible = false;
    rackGroup.add(fabricRoutes);
    // Show one GPU's 18 links, grouped as two ASIC endpoints per switch tray.
    // This is logical connectivity, not a cable-cartridge routing diagram.
    switchPositions.forEach((y, index) => {
      for (let asic = 0; asic < 2; asic++) {
        const lane = 4.1 + index * 0.045 + asic * 0.045;
        fabricRoutes.add(
          routedLine(
            [
              [2.8, computePositions[9], 2.12],
              [lane, computePositions[9], 2.12],
              [lane, y, 2.12],
              [2.3 + asic * 0.35, y, 2.12],
            ],
            colors.signal,
            0.65,
          ),
        );
      }
    });

    const trayBase = makeBox(12, 0.35, 8.8, 0xc0c8bb, [0, -0.6, 0]);
    computeDetail.add(trayBase);
    computeDetail.add(
      surfaceLabel(
        "Compute tray / logical connectivity, not a board floorplan",
        10,
        [0, -0.4, 4.0],
      ),
    );
    computeDetail.add(
      surfaceLabel("ConnectX / scale-out fabric", 8, [0, -0.4, -4.05]),
    );
    for (let pair = 0; pair < 2; pair += 1) {
      const x = pair === 0 ? -3 : 3;
      const grace = makeBox(
        1.4,
        0.75,
        2.1,
        colors.memoryDark,
        [x - 1.45, 0, 0],
        `grace-${pair}`,
        {
          eyebrow: "Selected / GB200 Superchip",
          title: "Grace CPU",
          body: "The Arm-based Grace host CPU runs control-heavy code and accesses GPU memory coherently through NVLink-C2C in the superchip module.",
          facts: [
            ["Role", "host compute + system memory"],
            ["Link", "900 GB/s bidirectional C2C per superchip"],
          ],
        },
      );
      computeDetail.add(grace);
      selectable.push(grace);
      computeDetail.add(
        surfaceLabel("Grace", 1.3, [x - 1.45, 0.39, 0], "#ffffff"),
      );
      [-1.4, 1.4].forEach((z, gpuInPair) => {
        const gpuX = x + 0.65;
        const gpu = makeBox(
          2.0,
          0.75,
          1.8,
          colors.compute,
          [gpuX, 0, z],
          `b200-${pair}-${gpuInPair}`,
          {
            eyebrow: "Selected / GB200 Superchip",
            title: "Blackwell B200 GPU",
            body: "The accelerator holds model shards and executes dense and sparse tensor operations. Its NVLink ports join the other seventy-one GPUs through the switch trays.",
            facts: [
              ["Per compute tray", "4 GPUs"],
              ["Scale-up ports", "18 NVLink 5 links"],
            ],
          },
        );
        computeDetail.add(gpu);
        selectable.push(gpu);
        computeDetail.add(
          surfaceLabel("B200", 1.7, [gpuX, 0.39, z], "#ffffff"),
        );
        computeDetail.add(
          routedLine(
            [
              [x - 0.72, 0.2, 0],
              [x - 0.43, 0.2, 0],
              [x - 0.43, 0.2, z],
              [gpuX - 1, 0.2, z],
            ],
            colors.signal,
            0.9,
          ),
        );
        const port = makeBox(
          0.9,
          0.2,
          0.35,
          colors.signal,
          [x - 0.65 + gpuInPair * 1.65, -0.25, 3.05],
          `scale-up-${pair}-${gpuInPair}`,
          {
            eyebrow: "Interconnect / scale-up",
            title: "NVLink to switch trays",
            body: "These connector symbols represent the GPU links into the rack NVSwitch fabric. They are not a port count or a physical cable layout. The scale-out NIC is a different communication boundary.",
            facts: [
              ["Logical scope", "72-GPU NVLink domain"],
              ["Separate path", "ConnectX for scale-out traffic"],
            ],
          },
        );
        computeDetail.add(port);
        selectable.push(port);
        computeDetail.add(
          routedLine(
            [
              [gpuX, 0.0, z],
              [gpuX + 1.2, 0.0, z],
              [gpuX + 1.2, 0.0, 2.6],
              [port.position.x, 0.0, 2.6],
              [port.position.x, 0.0, 3.05],
            ],
            colors.signal,
            0.55,
          ),
        );
      });
      computeDetail.add(surfaceLabel("NVLink-C2C", 1.7, [x - 0.25, 0.24, 0]));
      computeDetail.add(
        surfaceLabel("NVLink / scale-up", 4.6, [x, -0.39, 3.53]),
      );
    }
    for (let index = 0; index < 4; index += 1) {
      const nic = makeBox(
        1.3,
        0.35,
        0.75,
        colors.signal,
        [-4.5 + index * 3, -0.15, -3.25],
        `nic-${index}`,
        {
          eyebrow: "Selected / scale-out network",
          title: "ConnectX network adapter",
          body: "Network adapters carry compute-fabric traffic beyond the NVLink rack over InfiniBand or Ethernet and also connect the storage/in-band planes according to system design.",
          facts: [
            ["Boundary", "rack scale-out"],
            ["Software", "RDMA, NCCL, GPUDirect"],
          ],
        },
      );
      computeDetail.add(nic);
      selectable.push(nic);
      computeDetail.add(
        makeBox(0.65, 0.2, 0.18, colors.ink, [nic.position.x, -0.12, -3.69]),
      );
      computeDetail.add(
        surfaceLabel(
          `NIC ${index}`,
          1.2,
          [nic.position.x, 0.04, -3.23],
          "#ffffff",
        ),
      );
    }

    const refreshSelection = bindSelection(
      container,
      rig.camera,
      selectable,
      inspector,
    );
    const setView = (view: string) => {
      document
        .querySelectorAll<HTMLButtonElement>("[data-rack-view]")
        .forEach((button) => {
          button.classList.toggle(
            "is-active",
            button.dataset.rackView === view,
          );
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.rackView === view),
          );
        });
      rackGroup.visible = view !== "compute";
      computeDetail.visible = view === "compute";
      fabricRoutes.visible = view === "fabric";
      refreshSelection();
      rackGroup.children.forEach((child) => {
        if (
          !(child instanceof THREE.Mesh) ||
          !(child.material instanceof THREE.MeshStandardMaterial)
        )
          return;
        child.material.transparent = view === "fabric";
        child.material.opacity =
          view === "fabric" && !child.name.startsWith("switch") ? 0.12 : 1;
      });
      if (view === "rack") rig.frameObject(rackGroup, [11, 5, 23]);
      if (view === "fabric") rig.frameObject(rackGroup, [13, 1, 18]);
      if (view === "compute") rig.frameObject(computeDetail, [11, 7, 13]);
      refreshSelection.selectByTitle(
        view === "compute"
          ? "Grace CPU"
          : view === "fabric"
            ? "NVLink switch tray"
            : "Grace–Blackwell compute tray",
      );
    };
    const rackHost = container.closest<HTMLElement>(".three-lab")!;
    const rackSequence = sequencePanel(
      rackHost,
      "Separate the communication domains",
      [
        {
          label: "Host ↔ GPU",
          title: "CPU coherence is a local superchip relationship",
          body: "A Grace CPU and two Blackwell GPUs form each GB200 Superchip. NVLink-C2C is the coherent host-to-accelerator path; it is not the same connection as the GPU links to rack switches.",
        },
        {
          label: "GPU ↔ GPU",
          title: "Scale up through the rack’s NVSwitch fabric",
          body: "The highlighted routes show one GPU’s eighteen logical links, two endpoints in each of nine switch trays. All seventy-two GPUs join that fabric. The route drawing omits the other GPUs and is not physical cable placement.",
        },
        {
          label: "Beyond the rack",
          title: "Scale out through adapters and network switches",
          body: "ConnectX adapters expose a separate network path. Multi-rack collectives must account for this fabric’s latency, bandwidth and congestion as well as the NVLink domain. Connector locations here are schematic.",
        },
      ],
      (step) => {
        if (step < 0) return;
        setView(step === 1 ? "fabric" : "compute");
        refreshSelection.selectByTitle(
          ["Grace CPU", "NVLink switch tray", "ConnectX network adapter"][step],
        );
      },
    );
    container.addEventListener("atlas:componentinspect", rackSequence.reset);
    rig.frameObject(rackGroup, [11, 5, 23], false);
    document
      .querySelectorAll<HTMLButtonElement>("[data-rack-view]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          rackSequence.reset();
          setView(button.dataset.rackView ?? "rack");
        }),
      );
    document
      .querySelector<HTMLButtonElement>("[data-rack-reset]")
      ?.addEventListener("click", () => {
        rackSequence.reset();
        setView("rack");
      });
    rig.animate();
  } catch {
    container.textContent =
      "Interactive rack model unavailable. The composition and topology are described below.";
  }
}

function createLPUScene() {
  const container = document.getElementById("lpu-scene");
  if (!container) return;
  try {
    const rig = createSceneRig(container, [11, 9, 14]);
    rig.controls.target.set(0, 0, 0);
    rig.controls.minDistance = 7;
    rig.controls.maxDistance = 28;
    const chip = new THREE.Group();
    rig.scene.add(chip);
    const selectable: Selectable[] = [];
    const inspector = document.getElementById("lpu-inspector");

    chip.add(makeBox(12.6, 0.35, 8.2, 0x737b75, [0, -0.55, 0]));
    const tileTypes: {
      key: string;
      title: string;
      color: number;
      x: number;
      width: number;
      info: PartInfo;
    }[] = [
      {
        key: "mem-west",
        title: "MEM",
        color: colors.memory,
        x: -5.25,
        width: 1.3,
        info: {
          eyebrow: "Selected / memory slice",
          title: "MEM: distributed SRAM",
          body: "Memory units expose physical SRAM banks directly to software. The compiler schedules loads and knows where values live instead of relying on demand-filled hardware caches.",
          facts: [
            ["Published capacity", "220 MiB globally shared SRAM"],
            ["Hierarchy", "flat and software addressed"],
          ],
        },
      },
      {
        key: "mxm-west",
        title: "MXM",
        color: colors.compute,
        x: -3.55,
        width: 1.55,
        info: {
          eyebrow: "Selected / matrix slice",
          title: "MXM: matrix execution",
          body: "Matrix units hold weight tiles and consume streamed operands. In the published chip, matrix arrays expose large multiply-accumulate parallelism directly to the compiler schedule.",
          facts: [
            ["Pattern", "matrix multiply-accumulate"],
            ["Dataflow", "operands and results on streams"],
          ],
        },
      },
      {
        key: "sxm-west",
        title: "SXM",
        color: colors.signal,
        x: -1.9,
        width: 1.0,
        info: {
          eyebrow: "Selected / switch slice",
          title: "SXM: switch and reshape",
          body: "Switch units move, permute, and reshape tensor data between neighboring functional slices and off-chip links without a general cache-coherent fabric.",
          facts: [
            ["Purpose", "data movement + permutation"],
            ["Control", "compiler-scheduled routes"],
          ],
        },
      },
      {
        key: "vxm",
        title: "VXM",
        color: colors.warm,
        x: 0,
        width: 1.45,
        info: {
          eyebrow: "Selected / vector slice",
          title: "VXM: vector execution",
          body: "The center vector unit executes elementwise arithmetic, reductions, activations, normalization pieces, and other work surrounding matrix multiplication.",
          facts: [
            ["Work", "vector and special functions"],
            ["Placement", "chip center / stream turning point"],
          ],
        },
      },
      {
        key: "sxm-east",
        title: "SXM",
        color: colors.signal,
        x: 1.9,
        width: 1.0,
        info: {
          eyebrow: "Selected / switch slice",
          title: "SXM: switch and reshape",
          body: "Streams continue through reshape and switching resources. The one-dimensional organization makes movement explicit and statically schedulable.",
          facts: [
            ["Directions", "eastward / westward streams"],
            ["Network", "extends across chip links"],
          ],
        },
      },
      {
        key: "mxm-east",
        title: "MXM",
        color: colors.compute,
        x: 3.55,
        width: 1.55,
        info: {
          eyebrow: "Selected / matrix slice",
          title: "MXM: matrix execution",
          body: "Weights can be installed into matrix arrays, then reused while activations stream through. This differs from a GPU SM repeatedly fetching general operands through caches and HBM.",
          facts: [
            ["Locality", "compiler-managed weight placement"],
            ["Strength", "regular tensor algebra"],
          ],
        },
      },
      {
        key: "mem-east",
        title: "MEM",
        color: colors.memory,
        x: 5.25,
        width: 1.3,
        info: {
          eyebrow: "Selected / memory slice",
          title: "MEM: distributed SRAM",
          body: "SRAM banks at both sides feed the pipeline with low, predictable latency. Large models spread weights across many chips, turning chip-to-chip streaming into part of execution.",
          facts: [
            ["Bandwidth", "up to 80 TB/s product-sheet claim"],
            ["Capacity scaling", "additive across chips"],
          ],
        },
      },
    ];

    tileTypes.forEach((type) => {
      for (let row = 0; row < 4; row += 1) {
        const z = -2.7 + row * 1.8;
        const tile = makeBox(
          type.width,
          0.72,
          1.38,
          type.color,
          [type.x, 0, z],
          `${type.key}-${row}`,
          type.info,
        );
        chip.add(tile);
        selectable.push(tile);
        if (type.key.startsWith("mem")) {
          for (let bank = 0; bank < 8; bank++) {
            const cell = makeBox(
              0.22,
              0.13,
              0.47,
              colors.memoryDark,
              [
                type.x - 0.39 + (bank % 4) * 0.26,
                0.43,
                z - 0.32 + Math.floor(bank / 4) * 0.62,
              ],
              undefined,
              type.info,
            );
            chip.add(cell);
            selectable.push(cell);
          }
        } else if (type.key.startsWith("mxm")) {
          for (let cell = 0; cell < 16; cell++) {
            const pe = makeBox(
              0.25,
              0.12,
              0.25,
              colors.computeLight,
              [
                type.x - 0.48 + (cell % 4) * 0.32,
                0.43,
                z - 0.47 + Math.floor(cell / 4) * 0.31,
              ],
              undefined,
              type.info,
            );
            chip.add(pe);
            selectable.push(pe);
          }
        } else if (type.key === "vxm") {
          for (let lane = 0; lane < 6; lane++) {
            const element = makeBox(
              1.05,
              0.1,
              0.12,
              0xe0c7a2,
              [type.x, 0.42, z - 0.5 + lane * 0.2],
              undefined,
              type.info,
            );
            chip.add(element);
            selectable.push(element);
          }
        } else {
          for (let route = 0; route < 3; route++)
            chip.add(
              routedLine(
                [
                  [type.x - 0.35, 0.41, z - 0.45 + route * 0.3],
                  [type.x, 0.43, z + 0.25 - route * 0.15],
                  [type.x + 0.35, 0.41, z + 0.45 - route * 0.3],
                ],
                0xdce6fa,
                0.8,
              ),
            );
        }
      }
      chip.add(surfaceLabel(type.title, type.width, [type.x, 0.1, 3.65]));
    });
    chip.add(
      surfaceLabel(
        "Data streams / compiler-controlled movement",
        10,
        [0, 0.08, 4.35],
      ),
    );

    for (let index = 0; index < 12; index += 1) {
      const z = -3.55 + index * 0.65;
      const points = [
        new THREE.Vector3(-6.0, 0.48, z),
        new THREE.Vector3(6.0, 0.48, z),
      ];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: colors.signal,
          transparent: true,
          opacity: 0.22,
        }),
      );
      chip.add(line);
    }

    const instructionBars: Selectable[] = [];
    for (let index = 0; index < 14; index += 1) {
      const x = -5.75 + index * 0.88;
      const bar = makeBox(
        0.06,
        0.14,
        7.35,
        colors.ink,
        [x, 0.65, 0],
        `instruction-${index}`,
        {
          eyebrow: "Selected / control plane",
          title: "Independent instruction queues",
          body: "Instructions flow across the functional slices on compiler-defined timelines. The 2020 paper describes 144 independent instruction queues and very wide VLIW-like issue behavior.",
          facts: [
            ["Schedule", "explicit program order per queue"],
            ["Benefit", "predictable execution time"],
          ],
        },
      );
      bar.material.transparent = true;
      bar.material.opacity = 0.42;
      chip.add(bar);
      selectable.push(bar);
      instructionBars.push(bar);
    }

    const pulseGeometry = new THREE.SphereGeometry(0.12, 14, 14);
    const pulses = Array.from({ length: 8 }, (_, index) => {
      const pulse = new THREE.Mesh(
        pulseGeometry,
        new THREE.MeshBasicMaterial({ color: colors.signalPale }),
      );
      pulse.position.set(-6, 1.0, -2.9 + index * 0.82);
      pulse.visible = false;
      chip.add(pulse);
      return pulse;
    });
    let pulseStarted = -1;
    let pulseRoute: [number, number] = [-6, 6];

    const refreshSelection = bindSelection(
      container,
      rig.camera,
      selectable,
      inspector,
    );
    const setView = (view: string) => {
      document
        .querySelectorAll<HTMLButtonElement>("[data-lpu-view]")
        .forEach((button) => {
          button.classList.toggle("is-active", button.dataset.lpuView === view);
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.lpuView === view),
          );
        });
      instructionBars.forEach((bar) => {
        bar.material.opacity = view === "units" ? 0.2 : 0.1;
      });
      if (view === "flow") rig.frameObject(chip, [11, 9, 14]);
      if (view === "units") rig.frameObject(chip, [1.5, 13, 5]);
    };
    rig.frameObject(chip, [11, 9, 14], false);
    document
      .querySelector<HTMLButtonElement>("[data-lpu-pulse]")
      ?.addEventListener("click", () => {
        pulseRoute = [-6, 6];
        pulseStarted = performance.now();
        pulses.forEach((pulse) => {
          pulse.visible = true;
        });
      });
    const lpuHost = container.closest<HTMLElement>(".three-lab")!;
    const lpuSequence = sequencePanel(
      lpuHost,
      "Follow a scheduled tensor tile",
      [
        {
          label: "Read SRAM",
          title: "The compiler knows where the tile lives",
          body: "A program names software-managed SRAM locations and schedules when their contents enter streams. The banks in this cutaway indicate explicit storage, not a cache whose placement is decided on a miss.",
        },
        {
          label: "Matrix product",
          title: "Stream activations past installed weight tiles",
          body: "Matrix execution multiplies incoming operands with weights placed for reuse. The compiler must plan operand arrival, execution and the lifetime of the result across the program.",
        },
        {
          label: "Switch / reshape",
          title: "Put the next consumer’s operands in the right order",
          body: "Switching and reshaping are explicit dataflow operations. The tiny crossed routes stand for permutation and routing; they are not a disclosed crossbar wiring diagram.",
        },
        {
          label: "Vector operation",
          title: "Finish the work surrounding the matrix multiplication",
          body: "Vector resources perform elementwise, reduction and activation work. A matrix peak alone cannot predict the latency of a whole neural network layer.",
        },
        {
          label: "Store / forward",
          title: "Respect the next operation’s storage and arrival constraints",
          body: "Results return to software-managed storage or continue through the scheduled program. Multi-chip execution adds routes, link constraints and aggregate capacity to the same planning problem.",
        },
      ],
      (step) => {
        const names = ["MEM:", "MXM:", "SXM:", "VXM:", "MEM:"];
        if (step >= 0) refreshSelection.selectByTitle(names[step]);
        selectable.forEach((part) => {
          const active =
            step >= 0 &&
            (part.userData.info as PartInfo).title.startsWith(names[step]);
          part.material.emissive.setHex(active ? colors.signal : 0);
          part.material.emissiveIntensity = active ? 0.3 : 0;
        });
        if (step < 0) {
          pulseStarted = -1;
          pulses.forEach((p) => {
            p.visible = false;
          });
          return;
        }
        const routes: [number, number][] = [
          [-6, -5.25],
          [-5.25, -3.55],
          [-3.55, -1.9],
          [-1.9, 0],
          [0, 5.25],
        ];
        pulseRoute = routes[step];
        pulseStarted = performance.now();
        setView("units");
      },
    );
    container.addEventListener("atlas:componentinspect", lpuSequence.reset);
    document
      .querySelectorAll<HTMLButtonElement>("[data-lpu-view]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          lpuSequence.reset();
          setView(button.dataset.lpuView ?? "flow");
        }),
      );
    document
      .querySelector<HTMLButtonElement>("[data-lpu-reset]")
      ?.addEventListener("click", () => {
        lpuSequence.reset();
        setView("flow");
      });

    rig.animate((time) => {
      if (pulseStarted >= 0) {
        const progress = (time - pulseStarted) / 2400;
        pulses.forEach((pulse, index) => {
          const local = (progress - index * 0.045) % 1;
          pulse.position.x =
            pulseRoute[0] +
            Math.max(0, local) * (pulseRoute[1] - pulseRoute[0]);
          pulse.visible =
            progress < 1.15 &&
            local >= 0 &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        });
        if (progress > 1.15) pulseStarted = -1;
      }
    });
  } catch {
    container.textContent =
      "Interactive LPU model unavailable. The functional-slice architecture is described below.";
  }
}

export function initializeScenes() {
  createGPUScene();
  createRackScene();
  createLPUScene();
  createKernelScene(createSceneRig);
  document.querySelectorAll<HTMLElement>(".three-lab").forEach((host) => {
    const controls = host.querySelector(".three-controls");
    if (!controls) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workbench-expand";
    button.textContent = "Expand workbench";
    controls.append(button);
    const dialog = document.createElement("dialog");
    dialog.className = "workbench-dialog";
    dialog.setAttribute(
      "aria-label",
      host.querySelector("figcaption strong")?.textContent ?? "3D workbench",
    );
    document.body.append(dialog);
    let placeholder: Comment | null = null;
    const restore = () => {
      if (placeholder) {
        placeholder.replaceWith(host);
        placeholder = null;
      }
      host.classList.remove("is-expanded");
      button.textContent = "Expand workbench";
    };
    button.addEventListener("click", () => {
      if (dialog.open) {
        dialog.close();
        return;
      }
      placeholder = document.createComment("workbench position");
      host.before(placeholder);
      dialog.append(host);
      host.classList.add("is-expanded");
      button.textContent = "Close workbench";
      dialog.showModal();
    });
    dialog.addEventListener("close", restore);
    document.addEventListener("atlas:beforenavigate", () => {
      if (dialog.open) {
        restore();
        dialog.close();
      }
    });
    document.addEventListener("atlas:chapterchange", () => {
      if (dialog.open) dialog.close();
    });
  });
}
