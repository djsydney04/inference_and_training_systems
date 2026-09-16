import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** Shared camera tools for every 3D workbench, including numerical models. */
export function attachSceneNavigation(
  container: HTMLElement,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  fit: (direction?: THREE.Vector3, animated?: boolean) => void,
) {
  const stage = container.closest<HTMLElement>(".three-stage")!;
  const inspector = stage.querySelector<HTMLElement>(".scene-inspector");
  const initialDirection = camera.position.clone().sub(controls.target);
  const toolbar = document.createElement("div");
  toolbar.className = "diagram-camera-tools";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Diagram camera");
  const svg = (path: string) => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  toolbar.innerHTML = `<button type="button" data-camera="out" aria-label="Zoom out" title="Zoom out">${svg('<circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4M6 8.5h5"/>')}</button><button type="button" data-camera="in" aria-label="Zoom in" title="Zoom in">${svg('<circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4M6 8.5h5m-2.5-2.5v5"/>')}</button><span class="camera-divider"></span><button type="button" data-camera="fit" aria-label="Fit diagram to view" title="Fit to view">${svg('<path d="M3 7V3h4m6 0h4v4m0 6v4h-4m-6 0H3v-4"/><rect x="7" y="7" width="6" height="6" rx="1"/>')}</button><button type="button" data-camera="iso" aria-label="Isometric view" title="Isometric view">${svg('<path d="m10 2 7 4v8l-7 4-7-4V6Zm0 8 7-4m-7 4L3 6m7 4v8"/>')}</button><button type="button" data-camera="top" aria-label="Top view" title="Top view">${svg('<rect x="3" y="3" width="14" height="14" rx="1"/><path d="M3 8h14M8 8v9"/>')}</button><span class="camera-divider"></span><button type="button" data-camera="grid" aria-label="Show diagram grid" title="Show diagram grid" aria-pressed="true">${svg('<path d="M6 2v16M14 2v16M2 6h16M2 14h16"/>')}</button>${inspector ? `<button type="button" data-camera="inspector" aria-label="Hide inspector" title="Hide inspector" aria-expanded="true">${svg('<rect x="2" y="3" width="16" height="14" rx="1"/><path d="M12 3v14"/>')}</button>` : ""}`;
  container.append(toolbar);
  const hint = document.createElement("span");
  hint.className = "diagram-gesture-hint";
  hint.textContent = "Drag to orbit";
  container.append(hint);
  // Explicit zoom tools keep normal page scrolling available over large figures.
  controls.enableZoom = false;
  const description = container.closest(".three-lab")?.querySelector(".three-head figcaption > p");
  if (description?.textContent?.includes("scroll to zoom"))
    description.textContent = description.textContent.replace("scroll to zoom", "use the zoom controls");
  const zoom = (scale: number) => {
    const offset = camera.position.clone().sub(controls.target);
    const length = THREE.MathUtils.clamp(offset.length() * scale, controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset.setLength(length));
    controls.update();
  };
  toolbar.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button");
    if (!button) return;
    switch (button.dataset.camera) {
      case "in": zoom(.8); break;
      case "out": zoom(1.25); break;
      case "fit": fit(undefined, false); break;
      case "iso": fit(initialDirection.clone(), false); break;
      case "top": fit(new THREE.Vector3(0, 1, .001), false); break;
      case "grid": {
        const hidden = container.classList.toggle("diagram-grid-hidden");
        button.setAttribute("aria-pressed", String(!hidden));
        break;
      }
      case "inspector": {
        const hidden = stage.classList.toggle("diagram-inspector-hidden");
        if (inspector) inspector.hidden = hidden;
        button.setAttribute("aria-expanded", String(!hidden));
        button.setAttribute("aria-label", hidden ? "Show inspector" : "Hide inspector");
        button.title = hidden ? "Show inspector" : "Hide inspector";
        break;
      }
    }
  });
  // Controls are siblings of the WebGL canvas; their events never orbit the model.
  toolbar.addEventListener("pointerdown", event => event.stopPropagation());
  toolbar.addEventListener("pointerup", event => event.stopPropagation());
}
