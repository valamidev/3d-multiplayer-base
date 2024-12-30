const gravity = -9.8 / 60;
export const jumpSpeed = 1.5 / 16;
export const maxFallSpeed = -3000;

export const splineVerticalVelocity = (
  splineStartTime: number,
  initialJumpVelocity = 0 // Zero when just fall down from somewhere
) => {
  // Use meter / millisec

  let velocity =
    initialJumpVelocity * 1000 + gravity * (Date.now() - splineStartTime);

  // If velocity goes below zero, that means the character is now falling.
  // Once falling, we can clamp it to maxFallSpeed to mimic terminal velocity.
  if (velocity < maxFallSpeed) {
    return maxFallSpeed;
  }

  return velocity / 1000;
};
