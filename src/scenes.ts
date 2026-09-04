import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type PartInfo = {
  eyebrow: string;
  title: string;
  body: string;
  facts: [string, string][];
};

type Selectable = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

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

function createSceneRig(container: HTMLElement, cameraPosition: [number, number, number]) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  camera.position.set(...cameraPosition);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
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
  new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? true; }, { rootMargin: "200px" }).observe(container);

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  const animate = (onFrame?: (time: number) => void) => {
    const frame = (time: number) => {
      requestAnimationFrame(frame);
      if (!visible) return;
      controls.update();
      onFrame?.(time);
      renderer.render(scene, camera);
    };
    requestAnimationFrame(frame);
  };

  return { scene, camera, renderer, controls, animate };
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

  const resetColor = (mesh: Selectable) => {
    mesh.material.emissive.setHex(0x000000);
    mesh.material.emissiveIntensity = 0;
  };

  container.addEventListener("pointerup", (event) => {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectable, false)[0]?.object as Selectable | undefined;
    if (!hit?.userData.info) return;
    if (selected) resetColor(selected);
    selected = hit;
    hit.material.emissive.setHex(colors.signal);
    hit.material.emissiveIntensity = 0.34;
    updateInspector(inspector, hit.userData.info as PartInfo);
  });

  container.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    container.style.cursor = raycaster.intersectObjects(selectable, false).length ? "pointer" : "grab";
  });
}

function animateCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  destination: THREE.Vector3,
  target: THREE.Vector3,
) {
  const start = camera.position.clone();
  const startTarget = controls.target.clone();
  const started = performance.now();
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 650;
  const step = (now: number) => {
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
    const smDetail = new THREE.Group();
    smDetail.visible = false;
    rig.scene.add(packageGroup, smDetail);
    const selectable: Selectable[] = [];

    const substrate = makeBox(11.6, 0.36, 8.2, 0x6c746e, [0, -0.4, 0], "substrate", {
      eyebrow: "Selected / package",
      title: "Package substrate and interposer",
      body: "Dense wiring connects the compute dies to adjacent HBM stacks. Physical placement shortens the wide memory interface that would be impractical through a conventional socket.",
      facts: [["Job", "power + high-density signals"], ["System effect", "memory bandwidth begins in packaging"]],
    });
    packageGroup.add(substrate);
    selectable.push(substrate);

    const logic = makeBox(5.5, 0.72, 5.25, colors.compute, [0, 0.2, 0], "logic-die", {
      eyebrow: "Selected / compute",
      title: "GPU compute die",
      body: "Graphics processing clusters contain many streaming multiprocessors around a shared L2, memory partitions, copy engines, and high-speed interfaces.",
      facts: [["Inside", "GPC → TPC → SM"], ["Shared resources", "L2 + memory controllers"]],
    });
    packageGroup.add(logic);
    selectable.push(logic);

    const l2 = makeBox(1.15, 0.2, 4.75, colors.signal, [0, 0.67, 0], "l2-cache", {
      eyebrow: "Selected / memory hierarchy",
      title: "Shared L2 cache",
      body: "All SMs and copy paths share the device L2. It captures cross-block reuse, combines traffic, and sits between on-SM storage and HBM partitions.",
      facts: [["Scope", "whole GPU"], ["Question", "hit rate under the real access pattern"]],
    });
    packageGroup.add(l2);
    selectable.push(l2);

    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = -2.35 + column * 0.67;
        const z = -2.2 + row * 0.88;
        if (Math.abs(x) < 0.75) continue;
        const sm = makeBox(0.49, 0.13, 0.64, colors.computeLight, [x, 0.67, z], "sm", {
          eyebrow: "Selected / execution",
          title: "Streaming multiprocessor",
          body: "An SM keeps many warps resident, allocates their registers and shared memory, schedules ready instructions, and dispatches scalar, tensor, load/store, and special-function pipelines.",
          facts: [["Scheduling unit", "warp (32 threads)"], ["Fast storage", "register file + shared SRAM"]],
        });
        packageGroup.add(sm);
        selectable.push(sm);
      }
    }

    const hbmPositions: [number, number, number][] = [
      [-4.55, 0.22, -2.65], [-4.55, 0.22, 0], [-4.55, 0.22, 2.65],
      [4.55, 0.22, -2.65], [4.55, 0.22, 0], [4.55, 0.22, 2.65],
      [0, 0.22, -3.45], [0, 0.22, 3.45],
    ];
    hbmPositions.forEach((position, index) => {
      const hbm = makeBox(1.55, 0.9, 1.55, colors.memory, position, `hbm-${index}`, {
        eyebrow: "Selected / off-die memory",
        title: "High-bandwidth memory stack",
        body: "Vertically stacked DRAM dies connect through a very wide interface. HBM supplies far more bandwidth than socketed memory, but every avoidable round trip still costs energy and time.",
        facts: [["Stores", "weights, KV cache, activations"], ["Optimization", "reuse in registers / shared SRAM"]],
      });
      packageGroup.add(hbm);
      selectable.push(hbm);
    });

    for (let index = 0; index < 8; index += 1) {
      const port = makeBox(0.34, 0.35, 0.7, colors.signal, [-3.85 + index * 1.1, -0.05, 4.0], `nvlink-${index}`, {
        eyebrow: "Selected / scale-up fabric",
        title: "NVLink interface",
        body: "High-speed links carry GPU memory traffic toward peer GPUs through NVSwitch. The interface is distinct from HBM channels and from the scale-out network adapter.",
        facts: [["Scope", "GPU-to-GPU load/store fabric"], ["GB200 generation", "18 links per B200 GPU"]],
      });
      packageGroup.add(port);
      selectable.push(port);
    }

    const detailBase = makeBox(9, 0.32, 6.4, 0x707872, [0, -0.4, 0]);
    smDetail.add(detailBase);
    const registerFile = makeBox(2.2, 0.7, 4.9, colors.memory, [-2.9, 0.25, 0], "register-file", {
      eyebrow: "Selected / one SM",
      title: "Register file",
      body: "A large on-SM pool is allocated across resident threads. Registers provide operand bandwidth; using too many per thread can reduce residency or cause spills into device memory.",
      facts: [["Ownership", "logically per thread"], ["Tradeoff", "registers per thread vs occupancy"]],
    });
    smDetail.add(registerFile);
    selectable.push(registerFile);
    const shared = makeBox(1.15, 0.7, 4.9, colors.signal, [-1.0, 0.25, 0], "shared-memory", {
      eyebrow: "Selected / one SM",
      title: "Shared memory and L1",
      body: "Programmer-managed SRAM stages tiles shared by a thread block. Layout and bank access patterns determine whether parallel lanes access it efficiently.",
      facts: [["Ownership", "thread block / CTA"], ["Use", "tiling, reuse, exchange"]],
    });
    smDetail.add(shared);
    selectable.push(shared);
    const unitNames: [string, number, PartInfo][] = [
      ["warp schedulers", colors.warm, { eyebrow: "Selected / one SM", title: "Warp schedulers", body: "Schedulers issue instructions from warps whose dependencies are ready. Latency hiding comes from having independent eligible warps, not from making a slow memory operation disappear.", facts: [["Tracks", "ready warps + dependencies"], ["Failure mode", "scoreboard stalls"]] }],
      ["CUDA cores", colors.computeLight, { eyebrow: "Selected / one SM", title: "Scalar execution lanes", body: "Per-lane arithmetic executes ordinary integer and floating-point instructions. The exact mix and naming vary by GPU generation.", facts: [["Feeds", "one instruction across a warp"], ["Good for", "elementwise and address arithmetic"]] }],
      ["tensor cores", colors.compute, { eyebrow: "Selected / one SM", title: "Tensor cores", body: "Matrix multiply-accumulate units consume coordinated fragments. Their peak rate is reachable only when data layout, dtype, tiling, and pipeline scheduling keep them supplied.", facts: [["Operation", "tile MMA"], ["Dtypes", "generation-specific"]] }],
      ["load store", colors.signalPale, { eyebrow: "Selected / one SM", title: "Load/store pipelines", body: "Address generation and memory transactions move data between thread-visible spaces and the wider device hierarchy. Coalescing and alignment decide transaction efficiency.", facts: [["Question", "how many useful bytes per transaction?"], ["Wait state", "memory dependency"]] }],
    ];
    unitNames.forEach(([name, color, info], index) => {
      const unit = makeBox(1.0, 0.7, 4.9, color, [0.55 + index * 1.25, 0.25, 0], name, info);
      smDetail.add(unit);
      selectable.push(unit);
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), new THREE.ShadowMaterial({ opacity: 0.09 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.61;
    floor.receiveShadow = true;
    rig.scene.add(floor);

    bindSelection(container, rig.camera, selectable, document.getElementById("gpu-inspector"));
    const setView = (view: string) => {
      document.querySelectorAll<HTMLButtonElement>("[data-gpu-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.gpuView === view));
      packageGroup.visible = view !== "sm";
      smDetail.visible = view === "sm";
      if (view === "package") animateCamera(rig.camera, rig.controls, new THREE.Vector3(13, 12, 16.5), new THREE.Vector3());
      if (view === "die") animateCamera(rig.camera, rig.controls, new THREE.Vector3(3.8, 8.4, 4.6), new THREE.Vector3(0, 0.3, 0));
      if (view === "sm") animateCamera(rig.camera, rig.controls, new THREE.Vector3(8.5, 7.5, 10), new THREE.Vector3(0, 0, 0));
    };
    document.querySelectorAll<HTMLButtonElement>("[data-gpu-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.gpuView ?? "package")));
    document.querySelector<HTMLButtonElement>("[data-gpu-reset]")?.addEventListener("click", () => setView("package"));
    rig.animate((time) => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) packageGroup.rotation.y = Math.sin(time * 0.00016) * 0.05;
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
    const slotCount = 31;
    for (let slot = 0; slot < slotCount; slot += 1) {
      const y = -3.78 + slot * 0.41;
      const isSwitch = [2, 5, 8, 12, 15, 18, 22, 25, 28].includes(slot);
      const isPower = slot === 0 || slot === 30 || slot === 29 || slot === 1;
      if (isPower) {
        const shelf = makeBox(6.9, 0.31, 3.9, colors.warm, [0, y, 0], `power-${slot}`, {
          eyebrow: "Selected / rack infrastructure",
          title: "Power and cooling infrastructure",
          body: "Power shelves feed a high-current bus bar. Liquid manifolds route coolant to cold plates on the Grace CPUs, Blackwell GPUs, and NVSwitch ASICs; controls and leak detection remain separate concerns.",
          facts: [["Purpose", "dense power delivery"], ["Thermal path", "cold plate → facility water loop"]],
        });
        rackGroup.add(shelf); selectable.push(shelf);
      } else if (isSwitch) {
        const index = switchIndex++;
        const tray = makeBox(6.9, 0.31, 3.9, colors.signal, [0, y, 0], `switch-${index}`, {
          eyebrow: `Selected / NVLink switch tray ${index + 1}`,
          title: "NVLink switch tray",
          body: "Each of nine 1RU trays contains two NVSwitch ASICs. Across the rack, the eighteen switch chips form a non-blocking scale-up fabric for seventy-two GPUs.",
          facts: [["Per tray", "2 NVSwitch ASICs"], ["GPU relation", "one link from every GPU to each switch"]],
        });
        rackGroup.add(tray); selectable.push(tray);
      } else {
        const index = computeIndex++;
        const tray = makeBox(6.9, 0.31, 3.9, colors.compute, [0, y, 0], `compute-${index}`, {
          eyebrow: `Selected / compute tray ${index + 1}`,
          title: "Grace–Blackwell compute tray",
          body: "One tray contains two Grace CPUs and four B200 GPUs—two GB200 Superchips—plus networking, local storage, management, power conversion, and cold plates.",
          facts: [["Rack count", "18 trays"], ["Per tray", "2 Grace + 4 B200"]],
        });
        rackGroup.add(tray); selectable.push(tray);
      }
    }

    const busbar = makeBox(0.45, 12.5, 0.32, colors.warm, [3.2, 2.2, -2.15], "busbar", {
      eyebrow: "Selected / power plane",
      title: "Rack bus bar",
      body: "A low-voltage, high-current distribution spine connects power shelves to trays. At rack density, electrical delivery and conversion are first-order system design constraints.",
      facts: [["Carries", "rack DC power"], ["Constraint", "current, loss, redundancy"]],
    });
    rackGroup.add(busbar); selectable.push(busbar);

    const manifoldA = makeBox(0.25, 12.5, 0.25, 0x4b74bd, [-3.15, 2.2, -2.2], "cooling-supply", {
      eyebrow: "Selected / thermal plane",
      title: "Liquid cooling manifold",
      body: "Supply and return manifolds deliver coolant to tray cold plates. Flow rate, temperature, pressure, leak detection, and service isolation affect sustainable performance.",
      facts: [["Cools", "GPU, CPU, NVSwitch cold plates"], ["Why", "rack heat flux exceeds practical air cooling"]],
    });
    const manifoldB = manifoldA.clone() as Selectable;
    manifoldB.position.x = -2.7;
    manifoldB.userData = { ...manifoldA.userData };
    rackGroup.add(manifoldA, manifoldB); selectable.push(manifoldA, manifoldB);

    const lineMaterial = new THREE.LineBasicMaterial({ color: colors.signal, transparent: true, opacity: 0.18 });
    for (let index = 0; index < 18; index += 1) {
      const yStart = -2.9 + index * 0.62;
      const points = [new THREE.Vector3(2.9, yStart, -1.95), new THREE.Vector3(4.6, yStart, -2.6), new THREE.Vector3(4.6, 2.2, -2.6)];
      rackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
    }

    const trayBase = makeBox(10, 0.35, 6.8, 0x727a74, [0, -0.6, 0]);
    computeDetail.add(trayBase);
    for (let pair = 0; pair < 2; pair += 1) {
      const x = pair === 0 ? -2.55 : 2.55;
      const grace = makeBox(1.4, 0.75, 2.3, colors.memoryDark, [x, 0, 0], `grace-${pair}`, {
        eyebrow: "Selected / GB200 Superchip",
        title: "Grace CPU",
        body: "The Arm-based Grace host CPU runs control-heavy code and accesses GPU memory coherently through NVLink-C2C. in the superchip module.",
        facts: [["Role", "host compute + system memory"], ["Link", "900 GB/s bidirectional C2C per superchip"]],
      });
      computeDetail.add(grace); selectable.push(grace);
      [-1.25, 1.25].forEach((z, gpuInPair) => {
        const gpu = makeBox(2.0, 0.75, 1.8, colors.compute, [x, 0, z], `b200-${pair}-${gpuInPair}`, {
          eyebrow: "Selected / GB200 Superchip",
          title: "Blackwell B200 GPU",
          body: "The accelerator holds model shards and executes dense and sparse tensor operations. Its NVLink ports join the other seventy-one GPUs through the switch trays.",
          facts: [["Per compute tray", "4 GPUs"], ["Scale-up ports", "18 NVLink 5 links"]],
        });
        computeDetail.add(gpu); selectable.push(gpu);
      });
    }
    for (let index = 0; index < 4; index += 1) {
      const nic = makeBox(0.8, 0.55, 1.2, colors.signal, [-3.7 + index * 2.45, 0, -2.4], `nic-${index}`, {
        eyebrow: "Selected / scale-out network",
        title: "ConnectX network adapter",
        body: "Network adapters carry compute-fabric traffic beyond the NVLink rack over InfiniBand or Ethernet and also connect the storage/in-band planes according to system design.",
        facts: [["Boundary", "rack scale-out"], ["Software", "RDMA, NCCL, GPUDirect"]],
      });
      computeDetail.add(nic); selectable.push(nic);
    }

    bindSelection(container, rig.camera, selectable, inspector);
    const setView = (view: string) => {
      document.querySelectorAll<HTMLButtonElement>("[data-rack-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.rackView === view));
      rackGroup.visible = view !== "compute";
      computeDetail.visible = view === "compute";
      rackGroup.children.forEach((child) => {
        if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshStandardMaterial)) return;
        child.material.transparent = view === "fabric";
        child.material.opacity = view === "fabric" && !child.name.startsWith("switch") ? 0.12 : 1;
      });
      if (view === "rack") animateCamera(rig.camera, rig.controls, new THREE.Vector3(11, 7, 23), new THREE.Vector3(0, 2.2, 0));
      if (view === "fabric") animateCamera(rig.camera, rig.controls, new THREE.Vector3(13, 3, 18), new THREE.Vector3(0, 2.2, 0));
      if (view === "compute") animateCamera(rig.camera, rig.controls, new THREE.Vector3(11, 7, 13), new THREE.Vector3(0, 0, 0));
    };
    document.querySelectorAll<HTMLButtonElement>("[data-rack-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.rackView ?? "rack")));
    document.querySelector<HTMLButtonElement>("[data-rack-reset]")?.addEventListener("click", () => setView("rack"));
    rig.animate((time) => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && rackGroup.visible) rackGroup.rotation.y = Math.sin(time * 0.00012) * 0.04;
    });
  } catch {
    container.textContent = "Interactive rack model unavailable. The composition and topology are described below.";
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
    const tileTypes: { key: string; title: string; color: number; x: number; width: number; info: PartInfo }[] = [
      { key: "mem-west", title: "MEM", color: colors.memory, x: -5.25, width: 1.3, info: { eyebrow: "Selected / memory slice", title: "MEM: distributed SRAM", body: "Memory units expose physical SRAM banks directly to software. The compiler schedules loads and knows where values live instead of relying on demand-filled hardware caches.", facts: [["Published capacity", "220 MiB globally shared SRAM"], ["Hierarchy", "flat and software addressed"]] } },
      { key: "mxm-west", title: "MXM", color: colors.compute, x: -3.55, width: 1.55, info: { eyebrow: "Selected / matrix slice", title: "MXM: matrix execution", body: "Matrix units hold weight tiles and consume streamed operands. In the published chip, matrix arrays expose large multiply-accumulate parallelism directly to the compiler schedule.", facts: [["Pattern", "matrix multiply-accumulate"], ["Dataflow", "operands and results on streams"]] } },
      { key: "sxm-west", title: "SXM", color: colors.signal, x: -1.9, width: 1.0, info: { eyebrow: "Selected / switch slice", title: "SXM: switch and reshape", body: "Switch units move, permute, and reshape tensor data between neighboring functional slices and off-chip links without a general cache-coherent fabric.", facts: [["Purpose", "data movement + permutation"], ["Control", "compiler-scheduled routes"]] } },
      { key: "vxm", title: "VXM", color: colors.warm, x: 0, width: 1.45, info: { eyebrow: "Selected / vector slice", title: "VXM: vector execution", body: "The center vector unit executes elementwise arithmetic, reductions, activations, normalization pieces, and other work surrounding matrix multiplication.", facts: [["Work", "vector and special functions"], ["Placement", "chip center / stream turning point"]] } },
      { key: "sxm-east", title: "SXM", color: colors.signal, x: 1.9, width: 1.0, info: { eyebrow: "Selected / switch slice", title: "SXM: switch and reshape", body: "Streams continue through reshape and switching resources. The one-dimensional organization makes movement explicit and statically schedulable.", facts: [["Directions", "eastward / westward streams"], ["Network", "extends across chip links"]] } },
      { key: "mxm-east", title: "MXM", color: colors.compute, x: 3.55, width: 1.55, info: { eyebrow: "Selected / matrix slice", title: "MXM: matrix execution", body: "Weights can be installed into matrix arrays, then reused while activations stream through. This differs from a GPU SM repeatedly fetching general operands through caches and HBM.", facts: [["Locality", "compiler-managed weight placement"], ["Strength", "regular tensor algebra"]] } },
      { key: "mem-east", title: "MEM", color: colors.memory, x: 5.25, width: 1.3, info: { eyebrow: "Selected / memory slice", title: "MEM: distributed SRAM", body: "SRAM banks at both sides feed the pipeline with low, predictable latency. Large models spread weights across many chips, turning chip-to-chip streaming into part of execution.", facts: [["Bandwidth", "up to 80 TB/s product-sheet claim"], ["Capacity scaling", "additive across chips"]] } },
    ];

    tileTypes.forEach((type) => {
      for (let row = 0; row < 4; row += 1) {
        const z = -2.7 + row * 1.8;
        const tile = makeBox(type.width, 0.72, 1.38, type.color, [type.x, 0, z], `${type.key}-${row}`, type.info);
        chip.add(tile); selectable.push(tile);
      }
    });

    for (let index = 0; index < 12; index += 1) {
      const z = -3.55 + index * 0.65;
      const points = [new THREE.Vector3(-6.0, 0.48, z), new THREE.Vector3(6.0, 0.48, z)];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: colors.signal, transparent: true, opacity: 0.22 }));
      chip.add(line);
    }

    const instructionBars: Selectable[] = [];
    for (let index = 0; index < 14; index += 1) {
      const x = -5.75 + index * 0.88;
      const bar = makeBox(0.06, 0.14, 7.35, colors.ink, [x, 0.65, 0], `instruction-${index}`, {
        eyebrow: "Selected / control plane",
        title: "Independent instruction queues",
        body: "Instructions flow across the functional slices on compiler-defined timelines. The 2020 paper describes 144 independent instruction queues and very wide VLIW-like issue behavior.",
        facts: [["Schedule", "explicit program order per queue"], ["Benefit", "predictable execution time"]],
      });
      bar.material.transparent = true;
      bar.material.opacity = 0.42;
      chip.add(bar); selectable.push(bar); instructionBars.push(bar);
    }

    const pulseGeometry = new THREE.SphereGeometry(0.12, 14, 14);
    const pulses = Array.from({ length: 8 }, (_, index) => {
      const pulse = new THREE.Mesh(pulseGeometry, new THREE.MeshBasicMaterial({ color: colors.signalPale }));
      pulse.position.set(-6, 1.0, -2.9 + index * 0.82);
      pulse.visible = false;
      chip.add(pulse);
      return pulse;
    });
    let pulseStarted = -1;

    bindSelection(container, rig.camera, selectable, inspector);
    const setView = (view: string) => {
      document.querySelectorAll<HTMLButtonElement>("[data-lpu-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.lpuView === view));
      instructionBars.forEach((bar) => { bar.material.opacity = view === "units" ? 0.72 : 0.25; });
      if (view === "flow") animateCamera(rig.camera, rig.controls, new THREE.Vector3(11, 9, 14), new THREE.Vector3());
      if (view === "units") animateCamera(rig.camera, rig.controls, new THREE.Vector3(1.5, 13, 5), new THREE.Vector3());
    };
    document.querySelectorAll<HTMLButtonElement>("[data-lpu-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.lpuView ?? "flow")));
    document.querySelector<HTMLButtonElement>("[data-lpu-reset]")?.addEventListener("click", () => setView("flow"));
    document.querySelector<HTMLButtonElement>("[data-lpu-pulse]")?.addEventListener("click", () => {
      pulseStarted = performance.now();
      pulses.forEach((pulse) => { pulse.visible = true; });
    });

    rig.animate((time) => {
      if (pulseStarted >= 0) {
        const progress = (time - pulseStarted) / 2400;
        pulses.forEach((pulse, index) => {
          const local = (progress - index * 0.045) % 1;
          pulse.position.x = -6 + Math.max(0, local) * 12;
          pulse.visible = progress < 1.15 && local >= 0;
        });
        if (progress > 1.15) pulseStarted = -1;
      }
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) chip.rotation.y = Math.sin(time * 0.00013) * 0.035;
    });
  } catch {
    container.textContent = "Interactive LPU model unavailable. The functional-slice architecture is described below.";
  }
}

export function initializeScenes() {
  createGPUScene();
  createRackScene();
  createLPUScene();
}
