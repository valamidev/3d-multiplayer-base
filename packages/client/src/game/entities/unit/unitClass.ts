import { AbstractMesh, Scene } from '@babylonjs/core';

import mitt, { Emitter } from 'mitt';
import { MovementHandler } from '../../handlers/movement/movementHandler';

type UnitHooks = {
  ['none']: null;
};

export class UnitBase {
  public readonly hook: Emitter<UnitHooks> = mitt<UnitHooks>();

  public mesh: AbstractMesh | null = null;
  public distanceToGround: number = 0;
  public movementHandler: MovementHandler;

  constructor(public scene: Scene) {
    this.movementHandler = new MovementHandler(this.mesh);
  }
}
