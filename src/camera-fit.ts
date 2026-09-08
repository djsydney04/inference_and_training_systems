import * as THREE from "three";

/** Fit every bounding-box corner at a requested viewing direction. */
export function fitCameraToBounds(
  bounds: THREE.Box3,
  direction: THREE.Vector3,
  fov: number,
  aspect: number,
  padding = 1.12,
) {
  if (
    bounds.isEmpty() ||
    aspect <= 0 ||
    !Number.isFinite(aspect) ||
    direction.lengthSq() === 0
  )
    throw new Error("Camera framing requires nonempty bounds and a valid view");
  const target = bounds.getCenter(new THREE.Vector3());
  const forward = direction.clone().normalize();
  const right = new THREE.Vector3().crossVectors(
    new THREE.Vector3(0, 1, 0),
    forward,
  );
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  else right.normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(fov / 2)),
    tanH = tanV * aspect;
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new THREE.Vector3(x, y, z).sub(target);
        const depth = corner.dot(forward);
        distance = Math.max(
          distance,
          depth + Math.abs(corner.dot(right)) / tanH,
          depth + Math.abs(corner.dot(up)) / tanV,
        );
      }
  return {
    target,
    position: target.clone().addScaledVector(forward, distance * padding),
    distance: distance * padding,
  };
}
