import { Scene, Vector3 } from '@babylonjs/core';

import { CharacterHandler } from '../entities/characters/character';
import { NetworkHandler } from '../network/networkHandler';
import {
  CMSG_CHARACTER_UPDATE,
  MSG_CHARACTER_SPLINE_START,
  NETWORK_EVENTS,
  SMSG_CHARACTER_REMOVE,
  SMSG_CHARACTER_UPDATE,
} from '../../../../shared/src/networkPackets';
import { LightsHandler } from '../handlers/reflections/ligths';

const characterStates: Map<number, CharacterHandler> = new Map();

export class MainWorldUpdate {
  private scene: Scene;
  private lightsHandler: LightsHandler;
  private networkHandler: NetworkHandler;

  public activeCharacterGuid: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;

    this.networkHandler = NetworkHandler.getInstance();
    this.lightsHandler = LightsHandler.getInstance();
    this.networkHandler.on('networkEvent', this.processNetworkEvent.bind(this));

    // Init Fast update loop
    requestAnimationFrame(this.fastUpdateLoop);
  }

  private processNetworkEvent(
    e: Partial<{ event: NETWORK_EVENTS; [key: string]: any }>
  ) {
    const { event, ...payload } = e;

    // Force updates for Avatar should be added here
    if (payload.guid && this?.activeCharacterGuid === payload.guid) {
      return;
    }

    switch (event) {
      case NETWORK_EVENTS.SMSG_CHARACTER_UPDATE:
        this.UpdateCharacterState(payload as SMSG_CHARACTER_UPDATE);
        break;
      case NETWORK_EVENTS.SMSG_CHARACTER_REMOVE:
        this.RemoveCharacterState(payload as SMSG_CHARACTER_REMOVE);
        break;
      case NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START:
        this.UpdateSplineMovement(payload as MSG_CHARACTER_SPLINE_START);
        break;
    }
  }

  private UpdateSplineMovement(payload: MSG_CHARACTER_SPLINE_START) {
    const charState = characterStates.get(payload.guid);

    if (charState) {
      charState.setSplineMovement(payload);
      return;
    }
  }

  private UpdateCharacterState(payload: SMSG_CHARACTER_UPDATE) {
    const charState = characterStates.get(payload.guid);

    if (charState) {
      charState.update(payload);
      return;
    }

    if (!charState) {
      const characterObj = new CharacterHandler({
        scene: this.scene,
        shadowGenerator: this.lightsHandler.getShadowGenerators('spotLight'),
        guid: Number(payload.guid),
        position: new Vector3(
          payload.position._x,
          payload.position._y,
          payload.position._z
        ),
      });

      characterStates.set(payload.guid, characterObj);
    }
  }

  private RemoveCharacterState(payload: SMSG_CHARACTER_REMOVE) {
    const charState = characterStates.get(payload.guid);

    if (charState) {
      charState.remove();
      characterStates.delete(payload.guid);
    }
  }

  private fastUpdateLoop = () => {
    for (const characterState of characterStates.values()) {
      characterState.doInternalUpdate();
    }

    requestAnimationFrame(this.fastUpdateLoop);
  };
}
