import { Scene, UniversalCamera, Vector3 } from '@babylonjs/core';
import { ControllerClass } from '../../control/controlHandler';
import { ControlEvents, KeyboardMap } from '../../control/keyMap';
import { CameraMode } from './cameraMode';

export class AvatarCamera {
  scene: Scene;
  camera: UniversalCamera;
  angle: number = 180;
  controller!: ControllerClass;
  target: any;
  targetPosition!: Vector3;
  cameraMode: CameraMode = CameraMode.FreeLook;
  targetForward!: Vector3;

  constructor(scene: Scene) {
    this.scene = scene;
    this.camera = new UniversalCamera(
      'AvatarCamera',
      new Vector3(0, 5, -10),
      this.scene
    );

    this.setActive();
  }

  public update(): void {
    const desiredHeight = 5;
    const desiredDistance = 10;
    const smoothFactor = 0.8;

    let desiredPosition = this.targetPosition.clone();

    // Compute the desired camera position behind the character
    if (this.cameraMode === CameraMode.Follow) {
      desiredPosition = desiredPosition.add(
        this.targetForward.clone().scale(-desiredDistance)
      );
      desiredPosition.y += desiredHeight;
    }

    if (this.cameraMode === CameraMode.FreeLook) {
      // Compute the desired camera position behind the character
      const angle = this.angle; // Rotate based on time
      const offsetX = Math.sin(angle) * desiredDistance;
      const offsetZ = Math.cos(angle) * desiredDistance;
      desiredPosition = desiredPosition.add(
        new Vector3(offsetX, desiredHeight, offsetZ)
      );
    }

    // Smoothly move camera towards the desired position
    this.camera.position = Vector3.Lerp(
      this.camera.position,
      desiredPosition,
      smoothFactor
    );

    // Make the camera look at the character (e.g., torso height)
    const lookAtPos = this.targetPosition.clone();
    lookAtPos.y += 1.5; // aim at character's upper body
    this.camera.setTarget(lookAtPos);
  }

  public updateCharacterPosition(position: Vector3, forward: Vector3): void {
    this.targetPosition = position;
    this.targetForward = forward;
  }

  public handleCameraControl(event: ControlEvents, start = true): void {
    if (this.cameraMode === CameraMode.FreeLook) {
      switch (event) {
        case ControlEvents.arrowLeft:
          this.angle -= 0.1;
          break;
        case ControlEvents.arrowRight:
          this.angle += 0.1;
          break;
      }
    }
  }

  public setActive() {
    this.scene.activeCamera = this.camera;

    this.controller = ControllerClass.getInstance(this.scene);

    this.controller.on('keydown', (e: any) => {
      this.handleCameraControl(KeyboardMap[e.key], true);
      this.update();
    });
  }
}
