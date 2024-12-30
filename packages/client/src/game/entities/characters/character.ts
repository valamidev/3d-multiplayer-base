import { Scene, SceneLoader, ShadowGenerator, Vector3 } from '@babylonjs/core';

import { ControllerClass } from '../../control/controlHandler';
import { ControlEvents, KeyboardMap } from '../../control/keyMap';
import { CreatureStateMachine } from '../../handlers/stateMachines/creatureState';

import { NetworkHandler } from '../../network/networkHandler';

import { jumpSpeed } from '../../utils/simpleGravity';

import { UnitBase } from '../unit/unitClass';
import { GAME_TIME } from '../../../gameTime';
import { AvatarCamera } from '../../handlers/camera/avatarCameraHandler';
import {
  MSG_CHARACTER_TURN,
  NETWORK_EVENTS,
  CMSG_CHARACTER_UPDATE,
  CreatureState,
  MSG_CHARACTER_SPLINE_START,
} from 'base3dmulti-shared';

export class CharacterHandler extends UnitBase {
  public readonly guid!: number;
  protected position!: Vector3;

  private shadowGenerator!: ShadowGenerator;
  private callback: any;
  private controller!: ControllerClass;

  public stateMachine!: CreatureStateMachine;

  public turnPerUpdate!: number;

  animationGroups: any;
  networkHandler!: NetworkHandler;

  avatar = false;
  timer!: Timer;
  avatarCamera!: AvatarCamera;

  constructor(options: {
    scene: Scene;
    shadowGenerator: ShadowGenerator;
    guid: number;
    position: Vector3;
    callback?: () => void;
  }) {
    super(options.scene);
    Object.assign(this, options);

    this.stateMachine = new CreatureStateMachine();

    this.init();
  }

  private setAvatarMovementHooks() {
    this.movementHandler.hook.on('Turn', (e) => {
      this.networkHandler.sendToServer<MSG_CHARACTER_TURN>({
        event: NETWORK_EVENTS.MSG_CHARACTER_TURN,
        orientation: e.orientation,
        moveSpeed: e.moveSpeed,
        gameTime: GAME_TIME.now,
        guid: this.guid,
      });
    });

    this.movementHandler.hook.on('Run', (e) => {
      this.networkHandler.sendToServer<CMSG_CHARACTER_UPDATE>({
        event: NETWORK_EVENTS.CMSG_CHARACTER_UPDATE,
        moveSpeed: e.moveSpeed,
        moveVector: e.moveVector,
        state: CreatureState.RUN,
        position: this.movementHandler.position,
        orientation: e.orientation,
        guid: this.guid,
        gameTime: GAME_TIME.now,
      });
    });

    this.movementHandler.hook.on('Idle', (e) => {
      this.networkHandler.sendToServer<CMSG_CHARACTER_UPDATE>({
        event: NETWORK_EVENTS.CMSG_CHARACTER_UPDATE,
        moveSpeed: e.moveSpeed,
        moveVector: e.moveVector,
        state: CreatureState.IDLE,
        position: this.movementHandler.position,
        orientation: e.orientation,
        guid: this.guid,
        gameTime: GAME_TIME.now,
      });
    });

    this.movementHandler.hook.on('StartSpline', (e) => {
      this.networkHandler.sendToServer<MSG_CHARACTER_SPLINE_START>({
        event: NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START,
        guid: this.guid,
        gameTime: GAME_TIME.now,
        ...e,
      });
    });
  }

  private handleMovementState(event: ControlEvents, start = true): void {
    if (this.avatar && this.mesh) {
      if (event === ControlEvents.jump && start) {
        if (this.stateMachine.getState() !== CreatureState.SPLINE) {
          if (this.movementHandler.getSplineMovement()) {
            return;
          }

          this.movementHandler.setSplineMovement({
            splineStartTime: Date.now(),
            initialVelocity: jumpSpeed,
            splineDirection: new Vector3(0, 1, 0),
          });

          this.stateMachine.setState(CreatureState.SPLINE);
        }

        this.stateMachine.setState(CreatureState.SPLINE);
      }

      if (event === ControlEvents.turnRight) {
        if (start) {
          this.turnPerUpdate = -0.02;
        } else {
          this.turnPerUpdate = 0;
        }
      }

      if (event === ControlEvents.turnLeft) {
        if (start) {
          this.turnPerUpdate = 0.02;
        } else {
          this.turnPerUpdate = 0;
        }
      }

      if (event === ControlEvents.forward) {
        if (start) {
          this.movementHandler.moveVector = new Vector3(0, 0, 1);
          this.stateMachine.forceState(CreatureState.RUN);
        } else {
          this.stateMachine.setState(CreatureState.IDLE);
        }
      }

      if (event === ControlEvents.backward) {
        if (start) {
          this.movementHandler.moveVector = new Vector3(0, 0, -1);
          this.stateMachine.forceState(CreatureState.RUN);
        } else {
          this.stateMachine.setState(CreatureState.IDLE);
        }
      }
    }
  }

  private handleStateChange(state: CreatureState) {
    const idleAnim = this.animationGroups[8]; // Idle Neutral
    const runAnim = this.animationGroups[16]; // Run
    const runBackAnim = this.animationGroups[17]; // Run ack
    //  const runLeftAnim = this.animationGroups[18]; // Run left
    // const runRightAnim = this.animationGroups[19]; // Run right

    if (this?.mesh?.skeleton) {
      this.mesh.skeleton.returnToRest();
    }

    switch (state) {
      case CreatureState.IDLE:
        runAnim.stop();
        runBackAnim.stop();
        idleAnim.start(true);
        this.movementHandler.moveVector = Vector3.Zero();
        this.sendMoveEvent(NETWORK_EVENTS.MSG_CHARACTER_MOVE_STOP);
        break;
      case CreatureState.RUN:
        idleAnim.stop();

        if (this.movementHandler.moveVector._z > 0) {
          runBackAnim.stop();
          runAnim.start(true);
        }
        if (this.movementHandler.moveVector._z < 0) {
          runAnim.stop();
          runBackAnim.start(true);
        }

        this.sendMoveEvent(NETWORK_EVENTS.MSG_CHARACTER_MOVE_START);
        break;
      case CreatureState.Dead:
      case CreatureState.SPLINE:
        break;
    }

    if (this.mesh && this.avatar) {
      this.networkHandler.sendToServer<CMSG_CHARACTER_UPDATE>({
        event: NETWORK_EVENTS.CMSG_CHARACTER_UPDATE,
        moveSpeed: this.movementHandler.moveSpeed,
        moveVector: this.movementHandler.moveVector,
        state: this.stateMachine.getState(),
        position: this.mesh.position,
        orientation: this.movementHandler.getOrientation(),
        guid: this.guid,
        gameTime: GAME_TIME.now,
      });
    }
  }

  public sendMoveEvent(event: NETWORK_EVENTS) {
    if (this.mesh && this.avatar) {
      this.networkHandler.sendToServer<any>({
        event,
        guid: this.guid,
        moveSpeed: this.movementHandler.moveSpeed,
        moveVector: this.movementHandler.moveVector,
        state: this.stateMachine.getState(),
        position: this.mesh.position,
        orientation: this.movementHandler.getOrientation(),
        gameTime: GAME_TIME.now,
      });
    }
  }

  public setAvatar(): void {
    this.avatar = true;

    this.controller = ControllerClass.getInstance(this.scene);
    this.networkHandler = NetworkHandler.getInstance();

    this.avatarCamera = new AvatarCamera(this.scene);

    // Heartbeat
    setInterval(() => {
      if (this.mesh) {
        this.sendMoveEvent(NETWORK_EVENTS.CMSG_CHARACTER_UPDATE);
      }
    }, 1000);

    this.controller.on('keydown', (e: any) => {
      this.handleMovementState(KeyboardMap[e.key], true);
    });

    this.controller.on('keyup', (e: any) => {
      this.handleMovementState(KeyboardMap[e.key], false);
    });

    this.setAvatarMovementHooks();

    this.scene.onBeforeRenderObservable.add(() => {
      this.avatarUpdate();
    });
  }

  public doInternalUpdate() {
    if (this.avatar) {
      return;
    }

    this.movementHandler.handleMovement(this.turnPerUpdate);
  }

  private avatarUpdate() {
    if (this.mesh && this.avatar) {
      this.movementHandler.handleMovement(this.turnPerUpdate);

      // Get character position and forward vector
      const worldMatrix = this.mesh.getWorldMatrix();
      const forward = Vector3.TransformNormal(
        new Vector3(0, 0, 1),
        worldMatrix
      ).normalize();

      this.avatarCamera.updateCharacterPosition(
        this.mesh.position.clone(),
        forward
      );

      this.avatarCamera.update();
    }
  }

  public setSplineMovement(e: any): void {
    this.movementHandler.moveSpeed = e.moveSpeed;

    this.movementHandler.moveVector = e.moveVector;

    this.movementHandler.setOrientation(e.orientation);

    this.movementHandler.setSplineMovement(e);
  }

  public update(e: any): void {
    this.movementHandler.moveSpeed = e.moveSpeed;

    this.movementHandler.moveVector = e.moveVector;

    this.movementHandler.setOrientation(e.orientation);

    const newState = this.stateMachine.setState(e.state);

    if (newState && this.mesh) {
      this.mesh.position = new Vector3(
        e.position._x,
        e.position._y,
        e.position._z
      );
    }
  }

  public remove(): void {
    this.stateMachine.forceState(CreatureState.IDLE);

    clearInterval(this.timer);

    if (this.mesh) {
      this.mesh.dispose();
    }
  }

  private async init(): Promise<void> {
    await this.loadModel();

    this.stateMachine.forceState(CreatureState.IDLE);

    this.stateMachine.on('changeState', (e) => {
      this.handleStateChange(e);
    });

    this.movementHandler.hook.on('Run', (e) => {
      this.stateMachine.setState(CreatureState.RUN);
    });
    this.movementHandler.hook.on('Idle', (e) => {
      this.stateMachine.setState(CreatureState.IDLE);
    });
  }

  private async loadModel(): Promise<void> {
    const result = await SceneLoader.ImportMeshAsync(
      '',
      '/characters/',
      'MaleCharacter.glb',
      this.scene
    );
    result.animationGroups[0].stop();

    this.animationGroups = result.animationGroups;
    this.mesh = result.meshes[0];

    this.shadowGenerator.addShadowCaster(this.mesh);

    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.x;
    this.mesh.rotation.y = this.position.x;

    this.mesh.checkCollisions = true;

    this.distanceToGround = 0;

    this.movementHandler.mesh = this.mesh;

    // this.mesh.applyGravity = true; // applyGravity is not a property of AbstractMesh

    if (this.callback) {
      this.callback();
    }
  }
}
