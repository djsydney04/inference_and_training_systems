import { expect, test, type Page } from "@playwright/test";

async function navigate(page: Page, id: string) {
  await page.evaluate(id => document.dispatchEvent(new CustomEvent("atlas:navigate", { detail: id })), id);
  await expect(page.locator(`#${id}`)).toBeVisible();
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

test("chapter layouts and schematic labels fit their reading surfaces", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#landing-title")).toHaveText("AI Almanac");
  const routes = await page.locator(".course-chapter-link").evaluateAll(links => links.map(link => link.getAttribute("href")!.slice(1)));
  const findings: string[] = [];
  for (const id of ["welcome", "content-changes", "top", "gallery", ...routes, "glossary", "sources"]) {
    await navigate(page, id);
    const issues = await page.locator(`#${id}`).evaluate(async root => {
      const problems: string[] = [];
      // Include images below the fold, which normally load lazily as a reader scrolls.
      await Promise.all([...root.querySelectorAll<HTMLImageElement>("img.study-image")].map(async image => {
        image.loading = "eager";
        try { await image.decode(); }
        catch { problems.push(`illustration failed to load: ${image.getAttribute("src")}`); }
      }));
      if (document.documentElement.scrollWidth > innerWidth + 1) problems.push("page overflows viewport");
      for (const element of root.querySelectorAll<HTMLElement>("*")) {
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.right <= innerWidth + 2 || element.closest("svg,pre,dialog")) continue;
        let parent = element.parentElement;
        let scrollable = false;
        while (parent && parent !== root) {
          if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(parent).overflowX)) { scrollable = true; break; }
          parent = parent.parentElement;
        }
        if (!scrollable) problems.push(`${element.tagName}.${element.className}: clipped outside viewport`);
        if (problems.length >= 6) break;
      }
      for (const node of root.querySelectorAll<SVGGElement>(".lv-node")) {
        const box = node.querySelector("rect")!.getBBox();
        for (const text of node.querySelectorAll<SVGTextElement>("text")) {
          const label = text.getBBox();
          if (label.x < box.x - 1 || label.x + label.width > box.x + box.width + 1 || label.y + label.height > box.y + box.height + 1)
            problems.push(`schematic label outside node: ${text.textContent}`);
        }
      }
      return problems;
    });
    findings.push(...issues.map(issue => `${id}: ${issue}`));
  }
  expect(findings).toEqual([]);
  expect(errors).toEqual([]);
});

test("2D numerical workbenches preserve calculations and keyboard selection", async ({ page }) => {
  await page.goto("/#tiled-matmul");
  const matmul = page.locator("#matmul-workbench");
  await matmul.locator("[data-matmul-reset]").click();
  await expect(matmul.locator("canvas")).toHaveCount(0);
  const selected = matmul.locator('[data-output-cell="0,1"]');
  await selected.focus();
  await page.keyboard.press("Enter");
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(selected).toBeFocused();
  await expect(matmul).toHaveAttribute("data-playback-state", "paused");
  const next = matmul.locator("[data-matmul-next]");
  for (let step = 0; step < 13; step++) await next.click();
  await expect(next).toBeDisabled();
  const values = await matmul.locator("#matmul-inspector dl dd").allTextContents();
  expect(values[0]).toBe(values[1]);
  await matmul.locator("[data-matmul-shape]").selectOption("edges");
  await expect(matmul.locator(".is-padding").first()).toBeVisible();
  await expect(matmul.locator("[data-matmul-progress]")).toContainText("Step 0");

  await navigate(page, "ring-allreduce");
  const ring = page.locator("#ring-workbench");
  await ring.locator("[data-ring-reset]").click();
  await expect(ring.locator("canvas")).toHaveCount(0);
  await ring.locator('[data-rank="2"]').focus();
  await page.keyboard.press("Enter");
  await expect(ring.locator('[data-rank="2"]')).toHaveAttribute("aria-pressed", "true");
  await expect(ring.locator('[data-rank="2"]')).toBeFocused();
  await expect(ring).toHaveAttribute("data-playback-state", "paused");
  for (let step = 0; step < 6; step++) await ring.locator("[data-ring-next]").click();
  await expect(ring.locator(".ring-chunk.is-complete")).toHaveCount(16);
  await expect(ring.locator("[data-ring-next]")).toBeDisabled();
  await expect(ring.locator('.ring-rank[data-rank="0"] .ring-chunk').first()).toContainText("[52, 56]");
  await ring.locator("[data-ring-reset]").click();
  await expect(ring.locator(".ring-chunk.is-complete")).toHaveCount(0);
});

test("edition footer leads to educational changes and optional site releases", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator(".almanac-footer");
  await expect(footer).toBeVisible();
  await expect(page.locator("#content-changes")).toBeHidden();
  await expect(page.locator("#welcome .changelog")).toHaveCount(0);
  const edition = await footer.locator(".footer-edition").textContent();
  const version = edition!.match(/v(\d+\.\d+\.\d+)/)![1];
  await footer.getByRole("link", { name: "Content changes", exact: true }).click();
  const content = page.locator("#content-changes");
  await expect(page.locator("#welcome")).toBeHidden();
  await expect(page).toHaveTitle("Content changes | AI Almanac");
  await expect(page.locator("#changelog-title")).toBeFocused();
  await expect(content.getByRole("heading", { name: "Content changes", exact: true })).toBeVisible();
  await expect(content.locator(".content-edition").first()).toHaveAttribute("open", "");
  await expect(page.locator("#release-notes")).not.toHaveAttribute("open", "");
  await expect(content.getByRole("link", { name: "View on GitHub" })).toHaveAttribute("href", /\/CONTENT_CHANGELOG\.md$/);
  const missingLessons = await content.locator(".content-history li a").evaluateAll(links => links.map(link => link.getAttribute("href")!).filter(href => !href.startsWith("#") || !document.getElementById(href.slice(1))));
  expect(missingLessons).toEqual([]);
  const lesson = content.locator(".content-history li a").first();
  const lessonTarget = await lesson.getAttribute("href");
  await lesson.click();
  await expect(page.locator(lessonTarget!)).toBeVisible();
  await expect(content).toBeHidden();
  await page.goBack();
  await expect(content).toBeVisible();
  await page.goForward();
  await expect(page.locator(lessonTarget!)).toBeVisible();
  await page.goto("/#content-changes");
  await expect(content.getByRole("heading", { name: "Content changes", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await footer.getByRole("link", { name: "Site releases", exact: true }).click();
  const changelog = page.locator("#release-notes");
  await expect(page.locator("#welcome")).toBeHidden();
  await expect(changelog).toHaveAttribute("open", "");
  const latest = changelog.locator(".changelog-release").first();
  await expect(latest).toHaveAttribute("open", "");
  await expect(latest.locator("summary")).toContainText(version);
  await expect(latest.locator("time")).toHaveAttribute("datetime", await footer.locator("time").getAttribute("datetime") ?? "");
  await expect(changelog.getByRole("link", { name: "GitHub release history" })).toHaveAttribute("href", /github\.com\/djsydney04\/inference_and_training_systems\/blob\/main\/CHANGELOG\.md$/);
  const older = changelog.locator(".changelog-release").nth(1);
  await expect(older).not.toHaveAttribute("open", "");
  await older.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(older).toHaveAttribute("open", "");
  await expect(older.locator("li").first()).toBeVisible();
  await footer.getByRole("link", { name: "AI Almanac", exact: true }).click();
  await page.getByRole("link", { name: "Open the almanac", exact: true }).click();
  await expect(page.locator("#top")).toBeVisible();
  await expect(page.locator(".topbar")).toHaveCount(0);
});
