export interface SplineMovements {
  splineStartTime: number;
  initialVelocity: number;
  splineDirection: { _x: number; _y: number; _z: number };
  movePOV: { _x: number; _y: number; _z: number };
  moveVector: { _x: number; _y: number; _z: number };
  moveSpeed: number;
}
