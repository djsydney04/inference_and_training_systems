import * as THREE from "three";

export type DetailInfo = {
  eyebrow: string;
  title: string;
  body: string;
  facts: [string, string][];
};
type Part = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
const palette = {
  base: 0xd1d5ca,
  register: 0x879b88,
  compute: 0x37483e,
  signal: 0x2559d6,
  shared: 0xa7b9ca,
};

export function surfaceLabel(
  text: string,
  width: number,
  position: [number, number, number],
  color = "#293c31",
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  // Match the texture to its text: a fixed wide texture makes short labels tiny.
  context.font = '500 48px "IBM Plex Sans", sans-serif';
  canvas.width = Math.ceil(context.measureText(text).width) + 40;
  canvas.height = 96;
  context.font = '500 48px "IBM Plex Sans", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, (width * canvas.height) / canvas.width),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(...position);
  plane.renderOrder = 3;
  return plane;
}

export function routedLine(
  points: [number, number, number][],
  color = palette.signal,
  opacity = 0.6,
) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(...p)),
    ),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

const box = (
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  info?: DetailInfo,
): Part => {
  const part: Part = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.12 }),
  );
  part.position.set(x, y, z);
  part.castShadow = true;
  part.receiveShadow = true;
  if (info) part.userData.info = info;
  return part;
};

export function buildSM() {
  const group = new THREE.Group();
  const selectable: Part[] = [];
  const layers: THREE.Group[] = [];
  const labels = new THREE.Group();
  const routes = new THREE.Group();
  group.add(labels, routes);
  group.add(box(13.4, 0.28, 11.5, palette.base, 0, -0.45, 0));
  labels.add(
    surfaceLabel(
      "Streaming multiprocessor / execution teaching model",
      10.8,
      [0, -0.29, -5.3],
    ),
  );
  const info: Record<string, DetailInfo> = {
    registers: {
      eyebrow: "Storage / thread state",
      title: "Register banks",
      body: "Resident threads keep operands and intermediate results in an on-SM register file. The small banks here represent organization, not a count of physical registers or an exact bank mapping.",
      facts: [
        ["Software ownership", "per thread"],
        [
          "Capacity consequence",
          "more registers per thread can reduce residency",
        ],
        ["Spill path", "local address space backed by device memory"],
      ],
    },
    scheduler: {
      eyebrow: "Control / dependency readiness",
      title: "Warp scheduler and scoreboard",
      body: "Ready operands and available execution resources determine whether an instruction can issue. The scoreboard tracks dependencies; other eligible warps may proceed while one waits.",
      facts: [
        ["Warp", "32 logical threads"],
        ["Not implied", "32 dedicated physical ALUs per warp"],
        ["Inspect in a trace", "eligible work versus dependency stalls"],
      ],
    },
    lanes: {
      eyebrow: "Execution / one illustrative warp",
      title: "Scalar and vector execution",
      body: "The 32 cells visualize one warp’s logical lanes. One instruction operates on participating lanes; masks and dependencies affect which work is useful. The drawing is not an SM’s physical ALU count.",
      facts: [
        ["Typical work", "address arithmetic, elementwise operations"],
        ["Divergence", "different paths need masked execution"],
      ],
    },
    matrix: {
      eyebrow: "Execution / matrix operands",
      title: "Matrix multiply-accumulate tiles",
      body: "Tensor instructions consume coordinated operand tiles and update accumulators. Efficient execution needs a compatible shape, precision and memory layout plus a pipeline that keeps operands ready.",
      facts: [
        ["Math", "D = A × B + C"],
        ["Tiling", "reuse A and B across output elements"],
        ["Measure", "tensor throughput plus exposed operand stalls"],
      ],
    },
    accumulator: {
      eyebrow: "Storage / partial outputs",
      title: "Accumulator storage",
      body: "Partial matrix outputs must survive across reduction steps. Their physical residence depends on the instruction family: register fragments in some paths, specialized Tensor Memory for Blackwell tcgen05 operations.",
      facts: [
        ["Lifetime", "until reduction and epilogue finish"],
        ["Boundary", "not every tensor instruction uses the same storage"],
      ],
    },
    shared: {
      eyebrow: "Storage / cooperative staging",
      title: "Shared SRAM and L1",
      body: "Blocks stage reusable data in shared memory. L1 caching and the shared-memory carveout have distinct software semantics even when backed by a combined on-SM resource. Bank conflicts, synchronization and capacity shape kernel design.",
      facts: [
        [
          "Shared ownership",
          "thread block; cluster access is architecture dependent",
        ],
        ["Common use", "double-buffer A/B tiles"],
        ["B200 cc 10.0", "up to 228 KB shared memory per SM"],
      ],
    },
  };
  const add = (part: Part, parent: THREE.Group = group) => {
    parent.add(part);
    if (part.userData.info) selectable.push(part);
    return part;
  };
  for (let partition = 0; partition < 4; partition++) {
    const cx = partition % 2 === 0 ? -3.25 : 3.25,
      cz = partition < 2 ? -2.5 : 1.5;
    const layer = new THREE.Group();
    layers.push(layer);
    group.add(layer);
    add(box(6.0, 0.12, 3.55, 0xe2e5dc, cx, -0.2, cz), layer);
    labels.add(
      surfaceLabel(`Partition ${partition} / illustrative`, 4.4, [
        cx,
        -0.1,
        cz - 1.55,
      ]),
    );
    add(
      box(1.35, 0.25, 0.48, 0x65786a, cx - 2, 0.06, cz - 1.05, info.scheduler),
      layer,
    );
    for (let queue = 0; queue < 4; queue++)
      add(
        box(
          0.23,
          0.16,
          0.29,
          queue === 0 ? palette.signal : 0x98a58f,
          cx - 0.98 + queue * 0.32,
          0.04,
          cz - 1.05,
          info.scheduler,
        ),
        layer,
      );
    // Eight visible bank columns, with small row markers. Logical organization only.
    for (let bank = 0; bank < 8; bank++) {
      add(
        box(
          0.3,
          0.36,
          1.25,
          palette.register,
          cx - 2.55 + bank * 0.36,
          0.1,
          cz + 0.22,
          info.registers,
        ),
        layer,
      );
      for (let row = 0; row < 4; row++)
        add(
          box(
            0.24,
            0.025,
            0.15,
            0xc4d3bd,
            cx - 2.55 + bank * 0.36,
            0.295,
            cz - 0.19 + row * 0.27,
            info.registers,
          ),
          layer,
        );
    }
    for (let lane = 0; lane < 32; lane++)
      add(
        box(
          0.18,
          0.18,
          0.18,
          palette.compute,
          cx + 0.65 + (lane % 8) * 0.23,
          0.03,
          cz - 1.1 + Math.floor(lane / 8) * 0.23,
          info.lanes,
        ),
        layer,
      );
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++)
        add(
          box(
            0.27,
            0.28,
            0.27,
            palette.signal,
            cx + 0.68 + col * 0.33,
            0.08,
            cz + 0.15 + row * 0.33,
            info.matrix,
          ),
          layer,
        );
    for (let a = 0; a < 4; a++)
      add(
        box(
          0.45,
          0.12,
          0.23,
          0xc6d3e9,
          cx + 2.1,
          0.02 + a * 0.15,
          cz + 0.22 + a * 0.29,
          info.accumulator,
        ),
        layer,
      );
    labels.add(surfaceLabel("Registers", 2.5, [cx - 1.3, 0.5, cz + 0.95]));
    labels.add(surfaceLabel("Warp", 1.6, [cx + 1.35, 0.24, cz - 0.15]));
    labels.add(surfaceLabel("MMA", 1.25, [cx + 1.15, 0.39, cz + 1.42]));
    routes.add(
      routedLine(
        [
          [cx, -0.07, 4.43],
          [cx, -0.07, cz + 1.5],
          [cx + 1.2, -0.07, cz + 1.5],
        ],
        palette.signal,
        0.4,
      ),
    );
  }
  // A pair of staged operands with a visible inactive buffer beside each tile.
  for (let tile = 0; tile < 2; tile++) {
    const cx = tile === 0 ? -3.15 : 3.15;
    add(box(5.7, 0.22, 1.05, palette.shared, cx, -0.02, 4.38, info.shared));
    for (let cell = 0; cell < 16; cell++)
      add(
        box(
          0.26,
          0.08,
          0.26,
          cell < 8 ? 0x557cb4 : 0xc5d1d7,
          cx - 2.35 + cell * 0.3,
          0.14,
          4.33,
          info.shared,
        ),
      );
    labels.add(
      surfaceLabel(
        tile === 0 ? "A tile / shared SRAM" : "B tile / shared SRAM",
        4,
        [cx, 0.26, 4.78],
      ),
    );
  }
  const packet = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x2559d6 }),
  );
  packet.visible = false;
  group.add(packet);
  let stage = -1;
  let pulseStart = 0;
  let exploded = 0;
  const stageTitles = [
    "Shared SRAM and L1",
    "Warp scheduler and scoreboard",
    "Matrix multiply-accumulate tiles",
    "Accumulator storage",
  ];
  const setStage = (next: number) => {
    stage = next;
    pulseStart = performance.now();
    packet.visible = next >= 0;
    selectable.forEach((part) => {
      const active = part.userData.info?.title === stageTitles[next];
      part.material.emissive.setHex(active ? 0x2559d6 : 0);
      part.material.emissiveIntensity = active ? 0.35 : 0;
    });
  };
  return {
    group,
    selectable,
    labels,
    layers,
    setStage,
    setExploded: (amount: number) => {
      exploded = amount;
      layers.forEach((layer, i) => {
        layer.position.y = amount * (0.5 + i * 0.16);
      });
      labels.children.forEach((label, i) => {
        if (i < 1 || i > 16) return;
        if (label.userData.baseY === undefined)
          label.userData.baseY = label.position.y;
        label.position.y =
          label.userData.baseY +
          amount * (0.5 + Math.floor((i - 1) / 4) * 0.16);
      });
    },
    animate: (time: number) => {
      if (stage < 0) return;
      const progress = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? 1
        : Math.min(1, (time - pulseStart) / 1400);
      const start = new THREE.Vector3(-3.25, 0.5, 4.3),
        end = new THREE.Vector3(-2.05, 0.65 + exploded, stage < 2 ? 1.5 : -2.0);
      packet.position.lerpVectors(start, end, progress);
      packet.visible = progress < 1;
    },
  };
}

export type SequenceStep = { label: string; title: string; body: string };
export function sequencePanel(
  host: HTMLElement,
  title: string,
  steps: SequenceStep[],
  onStep: (index: number) => void,
) {
  const panel = document.createElement("section");
  panel.className = "machine-sequence";
  panel.innerHTML = `<div class="sequence-heading"><strong>${title}</strong><button data-sequence-reset>Explore freely</button></div><div class="sequence-buttons" role="group" aria-label="${title}">${steps.map((step, i) => `<button data-sequence-step="${i}" aria-pressed="false"><span>${i + 1}</span>${step.label}</button>`).join("")}</div><div class="sequence-explanation" aria-live="polite"><strong>Select a step to follow the mechanism.</strong><p>Geometry and blue highlights track the selected operation. These are explanatory stages, not measured clock cycles.</p></div>`;
  host.querySelector(".three-stage")!.after(panel);
  const reset = () => {
    panel
      .querySelectorAll<HTMLButtonElement>("[data-sequence-step]")
      .forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
  };
  panel
    .querySelectorAll<HTMLButtonElement>("[data-sequence-step]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const index = Number(button.dataset.sequenceStep);
        reset();
        button.classList.add("is-active");
        button.setAttribute("aria-pressed", "true");
        panel.querySelector(".sequence-explanation")!.innerHTML =
          `<strong>${steps[index].title}</strong><p>${steps[index].body}</p>`;
        onStep(index);
      }),
    );
  const resetSequence = () => {
    reset();
    panel.querySelector(".sequence-explanation")!.innerHTML =
      "<strong>Explore the components.</strong><p>Choose a part or orbit the model. Step mode is off.</p>";
    onStep(-1);
  };
  panel
    .querySelector("[data-sequence-reset]")!
    .addEventListener("click", resetSequence);
  return Object.assign(panel, { reset: resetSequence });
}
