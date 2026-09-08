import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { fitCameraToBounds } from "../src/camera-fit.ts";

test("camera framing keeps a chip or rack inside portrait and landscape viewports", () => {
  const objects = [
    new THREE.Box3(new THREE.Vector3(-7, -0.5, -6), new THREE.Vector3(7, 2, 6)),
    new THREE.Box3(new THREE.Vector3(-4, -5, -3), new THREE.Vector3(4, 9, 3)),
  ];
  for (const bounds of objects)
    for (const aspect of [0.55, 1, 1.7])
      for (const direction of [
        new THREE.Vector3(5, 15, 12),
        new THREE.Vector3(11, 5, 23),
      ]) {
        const frame = fitCameraToBounds(bounds, direction, 35, aspect);
        const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 200);
        camera.position.copy(frame.position);
        camera.lookAt(frame.target);
        camera.updateMatrixWorld();
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z]) {
              const projected = new THREE.Vector3(x, y, z).project(camera);
              assert.ok(
                Math.abs(projected.x) < 1 &&
                  Math.abs(projected.y) < 1 &&
                  projected.z < 1,
              );
            }
      }
});
