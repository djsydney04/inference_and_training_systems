import { expect, test, type Page } from "@playwright/test";

async function start(page: Page, hash = "decoder-block") {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto(`/#${hash}`);
  await expect(page.locator("[data-diagram-playback]").first()).toBeAttached();
  await page.clock.pauseAt(Date.now() + 1000);
}

test("execution traces advance, pause for inspection and preserve keyboard focus", async ({ page }) => {
  await start(page);
  const figure = page.locator("#decoder-block");
  await figure.locator(".block-pipeline").scrollIntoViewIfNeeded();
  await page.clock.runFor(7000);
  const before = Number(await figure.getAttribute("data-playback-frames"));
  expect(before).toBeGreaterThan(0);
  await page.clock.runFor(6500);
  expect(Number(await figure.getAttribute("data-playback-frames"))).toBeGreaterThan(before);
  await expect(figure.locator("[data-pipeline-readout]")).toHaveAttribute("aria-live", "off");
  await figure.locator('[data-step="2"]').click();
  await expect(figure).toHaveAttribute("data-playback-state", "paused");
  await expect(figure.locator("[data-pipeline-readout]")).toHaveAttribute("aria-live", "polite");
  const paused = await figure.getAttribute("data-playback-frames");
  await page.clock.runFor(16000);
  expect(await figure.getAttribute("data-playback-frames")).toBe(paused);
  const play = figure.locator("[data-playback-toggle]");
  await play.click();
  await figure.locator(".block-pipeline").scrollIntoViewIfNeeded();
  await page.clock.runFor(6500);
  expect(Number(await figure.getAttribute("data-playback-frames"))).toBeGreaterThan(Number(paused));
  await expect(play).toBeFocused();
});

test("hidden chapters stop, expanded diagrams continue and Escape restores the live figure", async ({ page }) => {
  await start(page);
  const figure = page.locator("#decoder-block");
  await figure.locator(".block-pipeline").scrollIntoViewIfNeeded();
  await page.clock.runFor(1000);
  await figure.getByRole("button", { name: "Open figure", exact: true }).click();
  await expect(page.locator("dialog.figure-popout")).toBeVisible();
  await page.locator("dialog.figure-popout .block-pipeline").scrollIntoViewIfNeeded();
  const before = Number(await figure.getAttribute("data-playback-frames"));
  await page.clock.runFor(7000);
  expect(Number(await figure.getAttribute("data-playback-frames"))).toBeGreaterThan(before);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.figure-popout")).not.toBeVisible();
  await expect(page.locator("#decoder-block")).toHaveCount(1);
  await page.evaluate(() => document.dispatchEvent(new CustomEvent("atlas:navigate", { detail: "rack" })));
  const hidden = await figure.getAttribute("data-playback-frames");
  await page.clock.runFor(20000);
  expect(await figure.getAttribute("data-playback-frames")).toBe(hidden);
});

test("component maps and comparisons stay still and remain manually explorable", async ({ page }) => {
  await start(page, "network-attention");
  const figure = page.locator('[data-nn-inspector="attention"]');
  await expect(figure.locator("[data-playback-toggle]")).toHaveCount(0);
  const key = figure.locator('[data-nn-part="key"]');
  await key.focus();
  await page.keyboard.press("Enter");
  await expect(key).toHaveAttribute("aria-pressed", "true");
  await expect(figure.locator("[data-nn-description]")).toHaveAttribute("aria-live", "polite");
  await page.clock.runFor(20000);
  await expect(key).toHaveAttribute("aria-pressed", "true");
  await expect(key).toBeFocused();
  await figure.getByRole("button", { name: "Open figure", exact: true }).click();
  await expect(figure.locator("[data-playback-toggle]")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(figure.getByRole("button", { name: "Open figure", exact: true })).toBeFocused();

  await page.evaluate(() => document.dispatchEvent(new CustomEvent("atlas:navigate", { detail: "quantization-scale-lab" })));
  const scale = page.locator("[data-quant-scale]");
  await scale.focus();
  await scale.press("ArrowRight");
  const value = await scale.inputValue();
  // Global animation preferences never enlist a static figure.
  await page.evaluate(() => {
    const toggle = document.querySelector<HTMLButtonElement>("[data-playback-all]")!;
    toggle.click(); toggle.click();
  });
  await page.clock.runFor(20000);
  await expect(scale).toHaveValue(value);
  await expect(page.locator("#quantization-scale-lab [data-playback-toggle]")).toHaveCount(0);
});

test("reduced motion starts paused and an explicit play opts in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/#decoder-block");
  const figure = page.locator("#decoder-block");
  await expect(figure).toHaveAttribute("data-playback-state", "paused");
  await page.clock.pauseAt(Date.now() + 1000);
  await page.clock.runFor(14000);
  expect(await figure.getAttribute("data-playback-frames")).toBeNull();
  await figure.locator("[data-playback-toggle]").click();
  await figure.locator(".block-pipeline").scrollIntoViewIfNeeded();
  await page.clock.runFor(7000);
  expect(Number(await figure.getAttribute("data-playback-frames"))).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(figure).toHaveAttribute("data-playback-state", "paused");
});

test("global pause and reading pace persist across reloads", async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("[data-playback-all]")!.click();
    const pace = document.querySelector<HTMLSelectElement>("[data-playback-default-pace]")!;
    pace.value = "10000";
    pace.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.reload();
  const figure = page.locator("#decoder-block");
  await expect(figure).toHaveAttribute("data-playback-state", "paused");
  await expect(figure.locator("[data-playback-pace]")).toHaveValue("10000");
  expect(await page.locator('[data-playback-state="playing"]').count()).toBe(0);
});

test("nested schematics preserve manual selection and announcements without playback", async ({ page }) => {
  await start(page, "training-state");
  const diagram = page.locator('#training-state .lesson-visual');
  const node = diagram.locator('[data-lv-node="1"]');
  await node.click();
  await expect(diagram.locator("[data-playback-toggle]")).toHaveCount(0);
  await expect(diagram.locator('.lv-selection')).toHaveAttribute("aria-live", "polite");
  await page.clock.runFor(20000);
  await expect(node).toHaveAttribute("aria-pressed", "true");
});

test("motion is optional and execution walkthroughs remain valid across repeated cycles", async ({ page }) => {
  await start(page, "orientation");
  const failures = await page.evaluate(async () => {
    document.querySelector<HTMLButtonElement>("[data-playback-all]")!.click();
    const modulePath = "/src/diagram-walkthroughs.ts";
    const { diagramWalkthrough, diagramHostSelector } = await import(/* @vite-ignore */ modulePath);
    const errors: string[] = [];
    for (const root of document.querySelectorAll<HTMLElement>(diagramHostSelector)) {
      if (root.closest(".atlas-gallery, .atlas-landing") || root.querySelector("[data-figure-open]")) continue;
      const adapter = diagramWalkthrough(root);
      const name = root.closest("[data-lesson]")?.id || root.id || root.className;
      if (root.matches("figure.book-study, figure.notebook-figure")) {
        // Authored artwork is static; a mislabeled live lab must still fail.
        const study = root.matches(".book-study");
        const image = root.querySelector<HTMLImageElement>(":scope > .book-study-art > img.study-image");
        const drawing = root.querySelector<SVGElement>(":scope > .notebook-scroll > svg[role=img]");
        const accessibleArtwork = study
          ? image?.getAttribute("src")?.trim() && image.getAttribute("alt")?.trim()
          : drawing?.getAttribute("aria-label")?.trim();
        const title = root.querySelector("figcaption strong")?.textContent?.trim();
        const controls = [...root.querySelectorAll("button,input,select,textarea,[role=button],[contenteditable=true]")];
        const embeddedLab = root.querySelector(`${study ? "svg," : ""}canvas,[data-diagram-playback],.three-lab,.textbook-lab`);
        if (adapter || !accessibleArtwork
          || !title || embeddedLab || controls.some(control => !control.closest(".figure-tools"))) {
          errors.push(`${name}: static figure must contain accessible captioned artwork without simulation controls`);
        }
        continue;
      }
      if (!adapter) {
        if (root.matches("[data-diagram-playback]")) errors.push(`${name}: static figure received playback`);
        continue;
      }
      try {
        for (let i = 0; i < 110; i++) {
          const note = adapter.advance();
          if (!note || /undefined|NaN/.test(note)) throw Error(`Invalid caption: ${note}`);
          for (const input of root.querySelectorAll<HTMLInputElement>("input")) {
            if (!input.checkValidity()) throw Error(`Invalid input: ${input.outerHTML}`);
          }
        }
      } catch (error) { errors.push(`${name}: ${error}`); }
    }
    return errors;
  });
  expect(failures).toEqual([]);
  for (const selector of ["#decoder-block", "#matmul-workbench", "#quantization-scale-lab"]) {
    const figure = page.locator(selector);
    await expect(figure).toHaveCount(1);
    await expect(figure.locator("[data-playback-toggle]")).toHaveCount(selector.includes("quantization") ? 0 : 1);
  }
});

test("diagram controls and captions fit a narrow viewport", async ({ page }) => {
  await start(page, "decoder-block");
  const figure = page.locator("#decoder-block");
  await figure.locator(".diagram-playback").scrollIntoViewIfNeeded();
  await figure.locator("[data-playback-pace]").selectOption("3000");
  await page.clock.runFor(10000);
  const overflow = await page.evaluate(() => ({ page: document.documentElement.scrollWidth > innerWidth + 1,
    controls: [...document.querySelectorAll<HTMLElement>('.chapter:not([hidden]) .playback-controls')].some(el => el.scrollWidth > el.clientWidth + 1) }));
  expect(overflow).toEqual({ page: false, controls: false });
});

test("wide diagrams reveal the active operation without scrolling the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, "decoder-block");
  const figure = page.locator("#decoder-block");
  const scroller = figure.locator(".block-pipeline");
  await scroller.scrollIntoViewIfNeeded();
  await page.clock.runFor(14000);
  await expect.poll(() => scroller.evaluate(root => {
    const selected = root.querySelector('.is-active')!.getBoundingClientRect();
    const bounds = root.getBoundingClientRect();
    return selected.left >= bounds.left - 1 && selected.right <= bounds.right + 1;
  })).toBe(true);
});

test("the transformer trace shares the same pause control", async ({ page }) => {
  await start(page, "decoder-block");
  const figure = page.locator("#decoder-block");
  await figure.locator("[data-transformer-play]").click();
  await expect(figure).not.toHaveAttribute("data-playback-state", "paused");
  await figure.locator("[data-playback-toggle]").click();
  const selected = await figure.locator("[data-step].is-active").getAttribute("data-step");
  await page.clock.runFor(8000);
  expect(await figure.locator("[data-step].is-active").getAttribute("data-step")).toBe(selected);
});
