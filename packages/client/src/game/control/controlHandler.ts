import { DeviceSourceManager, DeviceType, Scene } from '@babylonjs/core';
import EventEmitter from 'eventemitter3';
import { GAME_TIME } from '../../gameTime';

export class ControllerClass extends EventEmitter {
  private static instance: ControllerClass;
  private canvas!: HTMLCanvasElement;

  private keyStates: Map<string, { state: boolean; lastUpdate: number }>;

  private isRightMouseDown = false;
  private isLeftMouseDown = false;

  private deviceSourceManager!: DeviceSourceManager;

  private rightMouseDownSeq!: number;
  private rightMouseX!: number;
  private rightMouseY!: number;

  constructor(private scene: Scene) {
    super();

    this.keyStates = new Map();

    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) {
      throw new Error('Rendering canvas not found');
    }
    this.canvas = canvas;

    this.deviceSourceManager = new DeviceSourceManager(this.scene.getEngine());

    this.init();
  }

  public static getInstance(scene: Scene): ControllerClass {
    if (!ControllerClass.instance) {
      ControllerClass.instance = new ControllerClass(scene);
    }
    return ControllerClass.instance;
  }

  setKeyDown(key: string) {
    this.keyStates.set(key, { state: true, lastUpdate: Date.now() });
  }

  setKeyUp(key: string) {
    this.keyStates.set(key, { state: false, lastUpdate: Date.now() });
  }

  isKeyDown(key: string): boolean {
    return this.keyStates.get(key)?.state || false;
  }

  init() {
    this.canvas.addEventListener(
      'keyup',
      (e) => {
        this.setKeyUp(e.code);
        this.emit('keyup', e);
      },
      false
    );
    this.canvas.addEventListener(
      'keydown',
      (e) => {
        this.setKeyDown(e.code);
        this.emit('keydown', e);
      },
      false
    );

    if (this.deviceSourceManager) {
      this.deviceSourceManager
        .getDeviceSource(DeviceType.Mouse)
        ?.onInputChangedObservable.add((event) => {
          GAME_TIME.now;

          // Hold down right mouse
          if (this.isRightMouseDown === false && event.button === 2) {
            this.isRightMouseDown = true;

            this.rightMouseDownSeq = GAME_TIME.now;

            this.rightMouseX = event.x;
            this.rightMouseY = event.y;
          }

          if (
            this.isRightMouseDown === true &&
            event.button === 2
            //this.sequence !== this.rightMouseDownSeq
          ) {
            this.isRightMouseDown = false;

            this.emit('mouseRightStopRotate', 0);
          }

          if (this.isRightMouseDown) {
            const width = this.canvas.width;

            const rotateDegree = ((event.x - this.rightMouseX) / width) * 0.1;

            this.emit('mouseRightHoldRotate', rotateDegree);
          }
        });
    }

    /*
    this.canvas.addEventListener(
      "mouseup",
      (e) => {
        this.emit("mouseup", e);
      },
      false
    );
    this.canvas.addEventListener(
      "mousedown",
      (e) => {
        console.log("mousedown", e.button);

        this.emit("mousedown", e);
      },
      false
    );

    this.canvas.addEventListener(
      "mousemove",
      (e) => {
        this.emit("mousemove", e);
      },
      false
    );
    */
  }
}
