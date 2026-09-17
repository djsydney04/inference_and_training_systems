import "./diagram-playback.css";
import { DiagramClock } from "./diagram-clock";
import { diagramHostSelector, diagramWalkthrough } from "./diagram-walkthroughs";
import type { DiagramWalkthrough } from "./diagram-walkthroughs";

type Player = {
  root: HTMLElement;
  walkthrough: DiagramWalkthrough;
  clock: DiagramClock;
  bar: HTMLElement;
  button: HTMLButtonElement;
  status: HTMLElement;
  caption: HTMLElement;
  paused: boolean;
  override: boolean;
  liveRegions: Map<Element, string>;
};
const players = new Map<HTMLElement, Player>();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const readPreference = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const savePreference = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Private reading still works. */ } };
let pausedAll = readPreference("atlas-diagrams-paused") === "true" || reducedMotion.matches;
let globalButton: HTMLButtonElement;
let initialized = false;
const playing = (player: Player) => !player.paused && (!pausedAll || player.override);

function live(player: Player, muted: boolean) {
  player.root.querySelectorAll("[aria-live]").forEach(node => {
    // A larger diagram can contain another independently paused walkthrough.
    // Registration visits outer figures first; a nested figure may not yet
    // have its playback marker. Do not overwrite its original live setting.
    if (node.closest(diagramHostSelector) !== player.root) return;
    if (!player.liveRegions.has(node)) player.liveRegions.set(node, node.getAttribute("aria-live")!);
    const value = muted ? "off" : player.liveRegions.get(node)!;
    if (node.getAttribute("aria-live") !== value) node.setAttribute("aria-live", value);
  });
  for (const node of player.liveRegions.keys()) if (!node.isConnected) player.liveRegions.delete(node);
}

function update(player: Player, active = false) {
  const enabled = playing(player);
  player.root.dataset.playbackState = enabled ? active ? "playing" : "waiting" : "paused";
  player.button.textContent = enabled ? "Pause" : "Play";
  player.button.setAttribute("aria-label", enabled ? "Pause diagram animation" : "Play diagram animation");
  player.button.setAttribute("aria-pressed", String(enabled));
  player.status.textContent = enabled ? "Auto" : "Paused";
  player.bar.title = enabled ? "Select a component or change a setting to pause and explore." : "Press Play to continue the walkthrough from here.";
  live(player, enabled);
}

function pause(player: Player) {
  player.paused = true; player.override = false; player.clock.reset(); update(player);
}

function revealSelected(root: HTMLElement) {
  const selected = root.querySelector<HTMLElement>(".block-pipeline .is-active, .cpu-flow .is-active, .sequence-buttons .is-active");
  const scroller = selected?.closest<HTMLElement>(".block-pipeline, .cpu-flow, .sequence-buttons");
  if (!selected || !scroller || scroller.scrollWidth <= scroller.clientWidth) return;
  // Stop a previous pan before deciding that the new selection is already
  // visible; otherwise that older animation can move it out of view afterward.
  scroller.scrollTo({ left: scroller.scrollLeft, behavior: "instant" });
  const part = selected.getBoundingClientRect(), area = scroller.getBoundingClientRect();
  if (part.left >= area.left + 8 && part.right <= area.right - 8) return;
  scroller.scrollTo({ left: scroller.scrollLeft + part.left - area.left - (area.width - part.width) / 2, behavior: "instant" });
}

/** Register authored walkthroughs; safe to call after inserting additional figures. */
export function refreshDiagramPlayback() {
  document.querySelectorAll<HTMLElement>(diagramHostSelector).forEach(root => {
    if (players.has(root) || root.closest(".atlas-gallery") || root.querySelector("[data-figure-open]")) return;
    const walkthrough = diagramWalkthrough(root);
    if (!walkthrough) return;
    root.dataset.diagramPlayback = walkthrough.kind;
    const bar = document.createElement("div");
    bar.className = "diagram-playback";
    const kind = { flow: "Execution trace", simulation: "Live example" }[walkthrough.kind];
    bar.innerHTML = `<div class="playback-controls"><button type="button" data-playback-toggle aria-pressed="true">Pause</button><span class="playback-status">Auto</span><span class="playback-kind">${kind}</span></div><p class="playback-caption">Follow the execution steps automatically.</p>`;
    // Keep the original caption first and all playback controls inside expanded figures.
    const caption = root.querySelector(":scope > figcaption, :scope > .three-heading, :scope > .lab-heading");
    if (caption && caption !== root.lastElementChild) caption.after(bar); else root.prepend(bar);
    const player: Player = {
      root, walkthrough, clock: new DiagramClock(), bar,
      button: bar.querySelector("button")!, status: bar.querySelector(".playback-status")!,
      caption: bar.querySelector(".playback-caption")!,
      paused: false, override: false, liveRegions: new Map(),
    };
    players.set(root, player);
    player.button.addEventListener("click", () => {
      if (playing(player)) pause(player);
      else { player.paused = false; player.override = true; player.clock.reset(); update(player); }
    });
    root.addEventListener("atlas:playdiagram", () => {
      player.paused = false; player.override = true; player.clock.reset(); update(player);
    });
    const manual = (event: Event) => {
      if (!event.isTrusted) return;
      const target = event.target as Element;
      if (target.closest("[data-diagram-playback]") !== root || target.closest(".diagram-playback, .figure-tools, .workbench-expand")) return;
      // Reading notes and opening a larger view do not change the simulated state.
      if (target.closest("summary, [data-popout-open]")) return;
      pause(player);
    };
    root.addEventListener("pointerdown", manual, true);
    root.addEventListener("keydown", manual, true);
    root.addEventListener("input", manual, true);
    root.addEventListener("change", manual, true);
    root.addEventListener("focusin", manual);
    update(player);
  });
}

function available(player: Player, modal: HTMLDialogElement | undefined) {
  if (!playing(player) || document.hidden || (modal && !modal.contains(player.root))) return false;
  if (player.root.closest("[hidden], [inert], details:not([open])")) return false;
  // Moving the live node into a popout or changing its height can leave an
  // IntersectionObserver snapshot stale. The visible drawing is authoritative.
  const visual = player.root.querySelector<HTMLElement>("[data-chip-panel]:not([hidden]) .chip-canvas, .three-stage, .lv-canvas, .nn-diagram-scroll, .nn-whole, .sb-canvas, .architecture-scroll, .hd-canvas, canvas") ?? player.root;
  const box = visual.getBoundingClientRect();
  return box.width > 0 && box.height > 0 && box.bottom > 40 && box.top < window.innerHeight - 40;
}

export function initializeDiagramPlayback() {
  if (initialized) return;
  initialized = true;
  const settings = document.createElement("div");
  settings.className = "diagram-playback-settings";
  settings.innerHTML = '<button type="button" data-playback-all></button><p>Animations follow execution steps. Other figures stay still.</p>';
  document.querySelector(".reader-reference-links")?.before(settings);
  globalButton = settings.querySelector("button")!;
  const globalLabel = () => {
    globalButton.textContent = pausedAll ? "Play animations" : "Pause animations";
    globalButton.setAttribute("aria-pressed", String(!pausedAll));
  };
  globalButton.addEventListener("click", () => {
    pausedAll = !pausedAll;
    savePreference("atlas-diagrams-paused", String(pausedAll));
    players.forEach(player => { player.paused = false; player.override = false; player.clock.reset(); update(player); });
    globalLabel();
  });
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return; // Resuming is an explicit choice after reduced motion.
    pausedAll = true;
    players.forEach(player => { player.override = false; player.clock.reset(); update(player); });
    globalLabel();
  });
  globalLabel();
  refreshDiagramPlayback();
  document.addEventListener("visibilitychange", () => {
    players.forEach(player => { player.clock.reset(); update(player); });
  });
  document.addEventListener("atlas:beforenavigate", () => {
    players.forEach(player => { player.clock.reset(); update(player); });
  });
  window.setInterval(() => {
    const now = performance.now();
    const modal = [...document.querySelectorAll<HTMLDialogElement>("dialog[open]")].at(-1);
    players.forEach(player => {
      const active = available(player, modal);
      if (player.clock.tick(now, active)) {
        // All adapters keep focus on the reader's control; no navigation is allowed.
        const focused = document.activeElement;
        player.caption.textContent = player.walkthrough.advance();
        revealSelected(player.root);
        if (focused instanceof HTMLElement && focused.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
        player.root.dataset.playbackFrames = String(Number(player.root.dataset.playbackFrames ?? 0) + 1);
      }
      if (player.root.dataset.playbackState !== (playing(player) ? active ? "playing" : "waiting" : "paused")) update(player, active);
      if (active) {
        live(player, true);
      }
    });
  }, 250);
}
