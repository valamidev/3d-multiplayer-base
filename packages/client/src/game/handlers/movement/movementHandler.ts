import { AbstractMesh, Ray, Vector3 } from '@babylonjs/core';
import {
  BACKPEDAL_SPEED_MULTIPLIER,
  MIN_FALL_HEIGHT,
} from '../../../constants';
import { SplineMovements } from 'base3dmulti-shared';
import mitt, { Emitter } from 'mitt';
import { moveScale } from '../../utils/moveScale';
import { splineVerticalVelocity } from '../../utils/simpleGravity';
import { GAME_TIME } from '../../../gameTime';

type MovementHooks = {
  ['Landing']: null;
  ['Turn']: {
    orientation: number;
    moveSpeed: number;
    moveVector: Vector3;
    gameTime: number;
  };
  ['Run']: {
    orientation: number;
    moveSpeed: number;
    moveVector: Vector3;
    gameTime: number;
  };
  ['Idle']: {
    orientation: number;
    moveSpeed: number;
    moveVector: Vector3;
    gameTime: number;
  };
  ['StartSpline']: SplineMovements;
};

export class MovementHandler {
  public readonly hook: Emitter<MovementHooks> = mitt<MovementHooks>();

  private _moveVector = Vector3.Zero();
  private _moveSpeed = 1 / 16;
  private splineMovement!: SplineMovements | null;
  public mesh: AbstractMesh | null = null;
  public distanceToGround: number = 0;
  public lastUpdate!: number;

  constructor(mesh: AbstractMesh | null) {
    this.mesh = mesh;
  }

  public handleMovement(turnAmount: number = 0) {
    if (!this.mesh) {
      return;
    }

    if (turnAmount) {
      this.mesh.rotate(new Vector3(0, 1, 0), turnAmount);

      this.hook.emit('Turn', {
        orientation: this.getOrientation(),
        moveSpeed: this.moveSpeed,
        moveVector: this.moveVector,
        gameTime: GAME_TIME.now,
      });
    }

    if (this.getDistanceToGround() > MIN_FALL_HEIGHT) {
      // this.stateMachine.setState(CreatureState.SPLINE);
    }

    const splineMovement = this.getSplineMovement();
    const updateInterval = this.mesh.getScene().getEngine().getTimeStep();

    if (splineMovement) {
      let splineDisplace: Vector3;

      if (splineMovement) {
        const velocity = splineVerticalVelocity(
          splineMovement.splineStartTime,
          splineMovement.initialVelocity
        );

        if (this.distanceToGround < MIN_FALL_HEIGHT && velocity <= 0) {
          this.handleLanding();
          return;
        }

        let jumpVector = new Vector3(
          splineMovement.splineDirection._x,
          splineMovement.splineDirection._y,
          splineMovement.splineDirection._z
        );

        splineDisplace = jumpVector.clone();

        //  displace.y = 0;
        splineDisplace = splineDisplace.normalize();

        const moveDistanceScale = moveScale(
          velocity,
          updateInterval,
          this.lastUpdate
        );

        splineDisplace.scaleToRef(moveDistanceScale, splineDisplace);

        if (moveDistanceScale <= 0) {
          this.moveUntilHitGround(splineDisplace);
        } else {
          this.mesh.moveWithCollisions(splineDisplace);
        }
      }
    }

    if (this.moveVector._z !== 0) {
      let displace: Vector3;

      let moveVector = this.getMovePOV(this.mesh);

      displace = moveVector.clone();

      displace.y = 0;
      displace = displace.normalize();

      const moveDistanceScale = moveScale(
        this.moveSpeed,
        updateInterval,
        this.lastUpdate
      );

      displace.scaleToRef(moveDistanceScale, displace);

      this.mesh.moveWithCollisions(displace);
    }

    this.lastUpdate = Date.now();
  }

  public moveUntilHitGround(displace: Vector3) {
    const distanceToGround = this.distanceToGround;

    if (distanceToGround < MIN_FALL_HEIGHT) {
      return;
    }

    if (this.mesh) {
      this.mesh.position._y =
        distanceToGround + displace._y <= 0
          ? this.mesh.position._y - distanceToGround + MIN_FALL_HEIGHT / 2
          : this.mesh.position._y + displace._y;
      this.mesh.position._isDirty = true;
    }
  }

  private handleLanding() {
    this.setSplineMovement(null);

    if (this.moveVector._z !== 0) {
      this.hook.emit('Run', {
        orientation: this.getOrientation(),
        moveSpeed: this.moveSpeed,
        moveVector: this.moveVector,
        gameTime: GAME_TIME.now,
      });

      return;
    }

    this.hook.emit('Idle', {
      orientation: this.getOrientation(),
      moveSpeed: this.moveSpeed,
      moveVector: this.moveVector,
      gameTime: GAME_TIME.now,
    });
  }

  // Setters
  public set moveVector(vector: Vector3) {
    if (vector) {
      this._moveVector = vector;
    }
  }

  public set moveSpeed(speed: number) {
    if (speed) {
      this._moveSpeed = speed;
    }
  }

  public setSplineMovement(splineMovement: Partial<SplineMovements> | null) {
    if (this.mesh && splineMovement !== null) {
      this.splineMovement = {
        splineStartTime: 0,
        initialVelocity: 0,
        splineDirection: Vector3.Zero(),
        moveVector: this.moveVector,
        moveSpeed: this.moveSpeed,
        movePOV: this.getMovePOV(this.mesh),
        ...splineMovement,
      };

      this.hook.emit('StartSpline', {
        ...this.splineMovement,
      });
    } else {
      this.splineMovement = null;
    }
  }

  public setOrientation(newOrientation: number) {
    if (!this.mesh || !newOrientation) {
      return;
    }
    const currentOrientation = this.getOrientation();

    const coeff = newOrientation - currentOrientation;

    if (Math.abs(coeff) < 0.0001) {
      return;
    }

    this.mesh.rotate(new Vector3(0, 1, 0), coeff);
  }

  // Getters

  public get position() {
    return this.mesh?.position || Vector3.Zero();
  }

  public getDistanceToGround() {
    if (this.mesh) {
      const rayOrigin = this.mesh.position.clone();
      rayOrigin.y += 0.5; // start just above the character's feet
      const rayDirection = new Vector3(0, -1, 0);
      const rayLength = 100;
      const ray = new Ray(rayOrigin, rayDirection, rayLength);

      // Pick the closest mesh below
      const pickInfo = this.mesh.getScene().pickWithRay(ray, undefined, true);

      if (pickInfo?.hit && pickInfo.pickedPoint) {
        const groundPoint = pickInfo.pickedPoint;
        this.distanceToGround = this.mesh.position.y - groundPoint.y;
      } else {
        this.distanceToGround = 100;
      }
    }

    return this.distanceToGround;
  }

  public getOrientation() {
    if (this?.mesh?.rotationQuaternion) {
      return this.mesh.rotationQuaternion.toEulerAngles()._y;
    }

    return 0;
  }

  public getSplineMovement() {
    return this.splineMovement ?? null;
  }

  public get moveSpeed() {
    // Spline movement always has priority
    if (this.splineMovement) {
      return this.splineMovement.moveSpeed;
    }

    if (this.moveVector.z < 0) {
      return this._moveSpeed * BACKPEDAL_SPEED_MULTIPLIER;
    }
    return this._moveSpeed;
  }

  public get moveVector() {
    // Spline movement always has priority
    if (this.splineMovement) {
      return new Vector3(
        this.splineMovement.moveVector._x,
        this.splineMovement.moveVector._y,
        this.splineMovement.moveVector._z
      );
    }

    return this._moveVector;
  }

  public getMovePOV(mesh: AbstractMesh) {
    // Spline movement always has priority
    if (this.splineMovement) {
      return new Vector3(
        this.splineMovement.movePOV._x,
        this.splineMovement.movePOV._y,
        this.splineMovement.movePOV._z
      );
    }

    return mesh.calcMovePOV(
      this.moveVector._x,
      this.moveVector._y,
      this.moveVector._z
    );
  }
}
