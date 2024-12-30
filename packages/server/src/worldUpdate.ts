import { Singleton } from 'base3dmulti-shared/src/misc/decorators';

import mitt, { Emitter } from 'mitt';
import {
  DISCONNECT_IDLE_TIME,
  SESSIONS_STATE_UPDATE_INTERVAL,
} from './constants';

import {
  CMSG_CHARACTER_UPDATE,
  MSG_CHARACTER_MOVE_START,
  MSG_CHARACTER_MOVE_STOP,
  MSG_CHARACTER_SPLINE_START,
  MSG_CHARACTER_TURN,
  MSG_PING,
  MSG_PONG,
  NETWORK_EVENTS,
  SMSG_CHARACTER_UPDATE,
  WS_CLOSE_CONNECTION,
  WS_OPEN_CONNECTION,
} from 'base3dmulti-shared/src/networkPackets';
import {
  SessionStateMap,
  clearPlayerFromStateStores,
  CharacterStateMap,
  findSessionByCharacterId,
} from './states/statesStore';
import { castPacket } from './utils/utils';

export enum WorldStateEvents {
  CLOSE_CONNECTION = 'CLOSE_CONNECTION',
}

type WorldStateEventHandlers = {
  [NETWORK_EVENTS.MSG_PONG]: MSG_PONG;
  [NETWORK_EVENTS.WS_CLOSE_CONNECTION]: WS_CLOSE_CONNECTION;
  [NETWORK_EVENTS.WS_OPEN_CONNECTION]: WS_OPEN_CONNECTION;
  [NETWORK_EVENTS.CMSG_CHARACTER_UPDATE]: CMSG_CHARACTER_UPDATE;
  [NETWORK_EVENTS.MSG_CHARACTER_TURN]: MSG_CHARACTER_TURN;
  [NETWORK_EVENTS.MSG_CHARACTER_MOVE_START]: MSG_CHARACTER_MOVE_START;
  [NETWORK_EVENTS.MSG_CHARACTER_MOVE_STOP]: MSG_CHARACTER_MOVE_STOP;
  [NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START]: MSG_CHARACTER_SPLINE_START;
};

@Singleton
export class WorldState {
  public readonly emitter: Emitter<WorldStateEventHandlers> =
    mitt<WorldStateEventHandlers>();

  constructor() {
    setInterval(() => {
      this.CheckActiveSessions();
    }, SESSIONS_STATE_UPDATE_INTERVAL);

    this.InitHandlers();
  }

  private InitHandlers() {
    this.emitter.on(NETWORK_EVENTS.WS_CLOSE_CONNECTION, (e) => {
      const session = SessionStateMap.get(e.sessionId);

      if (session) {
        session.ws.close(1000);
        SessionStateMap.delete(e.sessionId);

        clearPlayerFromStateStores(session.characterId);

        this.SendPacketsToMap(session.mapId, [
          {
            event: NETWORK_EVENTS.SMSG_CHARACTER_REMOVE,
            guid: session.characterId,
          },
        ]);
      }
    });

    this.emitter.on(NETWORK_EVENTS.MSG_CHARACTER_TURN, (e) => {
      const character = CharacterStateMap.get(e.guid);

      if (character && character.gameTime <= e.gameTime) {
        character.orientation = e.orientation;
        character.moveSpeed = e.moveSpeed;
        character.gameTime = e.gameTime;
        CharacterStateMap.set(e.guid, character);

        this.UpdateMap(character.mapId);
      }
    });

    this.emitter.on(NETWORK_EVENTS.CMSG_CHARACTER_UPDATE, (e) => {
      this.updateCharacterEvents(e);
    });

    this.emitter.on(NETWORK_EVENTS.MSG_CHARACTER_MOVE_START, (e) => {
      this.updateCharacterEvents(e);
    });

    this.emitter.on(NETWORK_EVENTS.MSG_CHARACTER_MOVE_STOP, (e) => {
      this.updateCharacterEvents(e);
    });

    this.emitter.on(NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START, (e) => {
      this.broadcastCharacterEvent(e);
    });
  }

  private broadcastCharacterEvent(e: any) {
    const character = CharacterStateMap.get(e.guid);

    if (character) {
      this.SendPacketsToMap(character.mapId, [
        castPacket(NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START, e),
      ]);
    }
  }

  private updateCharacterEvents(
    e:
      | CMSG_CHARACTER_UPDATE
      | MSG_CHARACTER_MOVE_START
      | MSG_CHARACTER_MOVE_STOP
  ) {
    const character = CharacterStateMap.get(e.guid);

    let mapId = 0;

    if (!character) {
      const session = findSessionByCharacterId(e.guid);

      if (session) {
        CharacterStateMap.set(e.guid, {
          ...e,
          mapId: session.mapId,
          sessionId: session.sessionId,
        });
        mapId = session.mapId;
      }
    }

    if (character) {
      character.position = e.position;
      character.orientation = e.orientation;
      character.state = e.state;
      character.moveVector = e.moveVector;
      character.moveSpeed = e.moveSpeed;
      character.gameTime = e.gameTime;
      CharacterStateMap.set(e.guid, character);
      mapId = character.mapId;

      this.UpdateMap(mapId);
    }
  }

  private UpdateMap(mapId: number) {
    const updateCharacters: SMSG_CHARACTER_UPDATE[] = [];

    for (const characters of CharacterStateMap.values()) {
      if (characters.mapId === mapId) {
        updateCharacters.push({
          event: NETWORK_EVENTS.SMSG_CHARACTER_UPDATE,
          ...characters,
        });
      }
    }

    this.SendPacketsToMap(mapId, updateCharacters);
  }

  private SendPacketsToMap(mapId: number, networkPackets: any[]) {
    for (const session of SessionStateMap.values()) {
      if (session.mapId === mapId) {
        for (const packet of networkPackets) {
          session.ws.send(JSON.stringify(packet));
        }
      }
    }
  }

  private CheckActiveSessions() {
    //  console.log('Online players', SessionStateMap.size, SessionStateMap.size);

    for (const session of SessionStateMap.values()) {
      if (session.lastUpdate + DISCONNECT_IDLE_TIME < Date.now()) {
        this.emitter.emit(NETWORK_EVENTS.WS_CLOSE_CONNECTION, {
          sessionId: session.sessionId,
        });
      } else {
        session.ws.send(
          JSON.stringify({
            event: NETWORK_EVENTS.MSG_PING,
            senderTime: Date.now(),
          } as MSG_PING)
        );
      }
    }
  }
}
