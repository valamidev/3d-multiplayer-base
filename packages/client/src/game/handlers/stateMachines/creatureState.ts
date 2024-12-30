import EventEmitter from "eventemitter3";

import { CreatureState } from "../../../../../shared/src/states/creatureState";

export class CreatureStateMachine extends EventEmitter {
  private state!: CreatureState;

  constructor() {
    super();

    this.state = CreatureState.IDLE;
  }

  public getState() {
    return this.state;
  }

  public forceState(newState: CreatureState) {
    this.state = newState;

    this.changeState();
  }

  public setState(newState: CreatureState): boolean {
    if (this.state === newState) {
      return false;
    }

    this.state = newState;

    this.changeState();

    return true;
  }

  private changeState() {
    this.emit("changeState", this.state);
  }
}
