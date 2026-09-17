// An original explanatory package drawing. The cells imply organization, not a die floorplan.
export function machinePlate(prefix = "plate") {
  const cells = (x: number, y: number) => Array.from({ length: 48 }, (_, i) => {
    const px = x + (i % 8) * 12;
    const py = y + Math.floor(i / 8) * 13;
    return `<rect x="${px}" y="${py}" width="9" height="10" rx="1" fill="${i % 8 < 2 ? "#859aaa" : "#b7c5cd"}"/><path d="M${px + 2} ${py + 3}h5m-5 3h5" stroke="#42505a" stroke-width=".65"/>`;
  }).join("");
  const memory = [[52, 53], [52, 122], [52, 191], [347, 53], [347, 122], [347, 191]].map(([x, y]) => `<g class="plate-memory">${[9, 6, 3, 0].map(z => `<rect x="${x}" y="${y + z}" width="50" height="48" rx="2" fill="${z ? "#7c8d9b" : "#e0e7ee"}" stroke="#8a99a6" stroke-width="1"/>`).join("")}<rect x="${x + 6}" y="${y + 6}" width="38" height="34" rx="1" fill="#bdcbd9"/>${Array.from({length:5}, (_,i) => `<path d="M${x + 10} ${y + 11 + i*6}h30" stroke="#8b9aaa" stroke-width=".7"/>`).join("")}</g>`).join("");
  const routes = Array.from({length:12}, (_,i) => `<path d="M102 ${62+i*15}h${12+(i%4)*5}v${i%2 ? 7 : -7}H145M347 ${62+i*15}h-${12+(i%4)*5}v${i%2 ? -7 : 7}H304"/>`).join("");
  return `<figure class="machine-plate" data-layer="compute" aria-label="Interactive conceptual accelerator package">
    <div class="plate-heading"><span>Inside the accelerator</span><a href="#gpu" aria-label="Open the GPU workbench">Inspect in 3D <span aria-hidden="true">↗</span></a></div>
    <svg class="plate-svg" viewBox="0 0 620 410" role="img" aria-labelledby="${prefix}-title ${prefix}-desc"><title id="${prefix}-title">Compute, memory, and the paths between them</title><desc id="${prefix}-desc">An isometric conceptual accelerator package with two compute dies, six memory stacks, and the interconnect traces between them. Select a layer below to highlight it.</desc>
      <defs><pattern id="${prefix}-grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#c4c8ca"/></pattern><filter id="${prefix}-shadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <rect width="620" height="410" fill="url(#${prefix}-grid)" opacity=".45"/>
      <ellipse cx="306" cy="290" rx="226" ry="55" fill="#223544" opacity=".12" filter="url(#${prefix}-shadow)"/>
      <g transform="matrix(.79 .34 -.68 .44 242 41)">
        <path d="M20 26H432V297H20Z" fill="#89969a" stroke="#718185"/><path d="M20 285H432v12H20Z" fill="#73868b"/>
        <rect x="20" y="12" width="412" height="273" rx="7" fill="#d3dbd8" stroke="#99aaa6" stroke-width="1.5"/>
        <rect x="32" y="24" width="388" height="249" rx="3" fill="#e3e8e3" stroke="#b8c6bd"/>
        ${Array.from({length:38}, (_, i) => `<path d="M${42+i*10} 25v7m0 229v10" stroke="#9daa9e" stroke-width="3"/>`).join("")}
        <g class="plate-fabric" stroke="#2559d6" stroke-width="1.2" fill="none">${routes}<path d="M145 139H304M145 144H304M145 149H304M145 154H304M145 159H304"/></g>
        <g class="plate-compute"><rect x="137" y="42" width="178" height="198" rx="3" fill="#718084" stroke="#586b73"/><rect x="141" y="37" width="170" height="198" rx="3" fill="#283b47" stroke="#405969"/><rect x="147" y="43" width="158" height="186" rx="1" fill="#394d5b"/>
          ${cells(157, 51)}${cells(157, 143)}
          <rect x="259" y="51" width="35" height="76" fill="#637d90"/><rect x="259" y="143" width="35" height="76" fill="#637d90"/>
          ${Array.from({length:14},(_,i)=>`<path d="M264 ${56+i*5}h25m-25 92h25" stroke="#afbdc4" stroke-width="1"/>`).join("")}
          <path d="M151 135h147" stroke="#92a6b5" stroke-width="2"/>
        </g>${memory}
        ${[[38,38],[410,38],[38,258],[410,258]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#b1bcb6" stroke="#8f9f95"/><circle cx="${x}" cy="${y}" r="1.4" fill="#e9eee9"/>`).join("")}
      </g>
      <g fill="none" stroke="#88949d" stroke-width="1"><path d="M321 159v-77h77"/><circle cx="321" cy="159" r="2" fill="#2559d6"/><path d="M161 217H75v45"/><circle cx="161" cy="217" r="2" fill="#2559d6"/><path d="M371 277v58h79"/><circle cx="371" cy="277" r="2" fill="#2559d6"/></g>
      <g font-family="IBM Plex Sans, sans-serif" font-size="11" fill="#596770"><text x="404" y="85">Compute dies</text><text x="42" y="280">Memory stacks</text><text x="458" y="339">Interconnect</text></g>
    </svg>
    <figcaption><div class="plate-layers" role="group" aria-label="Highlight a package layer"><button type="button" data-plate-layer="compute" aria-pressed="true"><i></i>Compute</button><button type="button" data-plate-layer="memory" aria-pressed="false"><i></i>Memory</button><button type="button" data-plate-layer="fabric" aria-pressed="false"><i></i>Interconnect</button></div><p class="plate-description" aria-live="polite">Compute dies execute the model’s matrix and vector operations.</p><small>Conceptual package · not a physical floorplan</small></figcaption>
  </figure>`;
}

export function initializeMachinePlates(root: ParentNode) {
  const descriptions: Record<string, string> = {
    compute: "Compute dies execute the model’s matrix and vector operations.",
    memory: "Memory stacks supply weights, activations, and cached state.",
    fabric: "The interconnect carries data between memory and compute.",
  };
  root.querySelectorAll<HTMLElement>(".machine-plate").forEach(plate => {
    plate.querySelectorAll<HTMLButtonElement>("[data-plate-layer]").forEach(button => {
      button.addEventListener("click", () => {
        const layer = button.dataset.plateLayer!;
        plate.dataset.layer = layer;
        plate.querySelectorAll<HTMLButtonElement>("[data-plate-layer]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        plate.querySelector(".plate-description")!.textContent = descriptions[layer];
      });
    });
  });
}
