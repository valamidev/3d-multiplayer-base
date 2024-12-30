import { Scene } from '@babylonjs/core';

export const findCameraHandler = (scene: Scene, name: string) => {
  return scene.cameras[scene.cameras.findIndex((e) => e.name === name) || 0];
};
