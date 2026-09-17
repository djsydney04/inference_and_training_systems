import test from "node:test";
import assert from "node:assert/strict";
import { chipExplorers, chipRouteStep, outputContention } from "../src/chip-anatomy-data.ts";

test("every route follows directed edges and opens a view in its own explorer", () => {
  const views = chipExplorers.flatMap(explorer => explorer.views);
  assert.equal(new Set(views.map(view => view.id)).size, views.length);
  for (const explorer of chipExplorers) for (const view of explorer.views) {
    const ids = new Set(view.parts.map(p => p.id));
    assert.equal(ids.size, view.parts.length);
    for (const part of view.parts) {
      if (part.open) assert.ok(explorer.views.some(v => v.id === part.open));
      assert.ok(part.x >= 0 && part.x + 196 <= 988);
      for (const other of view.parts.filter(p => p !== part)) {
        assert.ok(part.x + 196 <= other.x || other.x + 196 <= part.x || part.y + 90 <= other.y || other.y + 90 <= part.y, `${view.id}: overlapping components`);
      }
    }
    view.edges.forEach(edge => { assert.ok(ids.has(edge.from)); assert.ok(ids.has(edge.to)); });
    view.routes.forEach((route, r) => route.steps.forEach((id, s) => {
      const state = chipRouteStep(view, r, s);
      assert.equal(state.current.id, id);
      if (s) assert.ok(view.edges.some(edge => edge.from === state.previous && edge.to === id), `${view.id}: missing route edge`);
    }));
    assert.throws(() => chipRouteStep(view, 0, -1));
    assert.throws(() => chipRouteStep(view, 0, view.routes[0].steps.length));
    assert.throws(() => chipRouteStep(view, 999, 0));
  }
});

test("switch contention conserves payload and accounts for bits versus bytes", () => {
  const one = outputContention(1, 400, 1);
  assert.ok(Math.abs(one.finishUs - 20.97152) < 1e-10);
  assert.equal(one.queuedBytes, 0);
  const four = outputContention(4, 400, 1);
  assert.equal(four.fairGbps, 100);
  assert.equal(four.finishUs, 4 * one.finishUs);
  assert.equal(four.queuedBytes, 3 * 2 ** 20);
  // Integrate the output's service before and after the input burst ends.
  const outputBytesDuringBurst = four.inputUs / 1e6 * 50e9;
  assert.ok(Math.abs(outputBytesDuringBurst + four.queuedBytes - 4 * 2 ** 20) < 1e-8);
  assert.equal(outputContention(4, 800, 1).finishUs, four.finishUs / 2);
  assert.equal(outputContention(4, 400, 16).finishUs, four.finishUs * 16);
  for (const count of [0, -1, 1.5, 17, NaN]) assert.throws(() => outputContention(count, 400, 1));
  for (const value of [0, -1, NaN, Infinity]) {
    assert.throws(() => outputContention(4, value, 1));
    assert.throws(() => outputContention(4, 400, value));
  }
});
