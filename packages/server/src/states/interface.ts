import { ServerWebSocket } from 'bun';
import { ICharacterState } from 'base3dmulti-shared/src/states/characterState';

export interface ISessionState {
  sessionId: string;
  ws: ServerWebSocket<unknown>;
  mapId: number;
  lastUpdate: number;
  characterId: number;
  latency: number;
}

export interface ICharacterStateServer extends ICharacterState {
  sessionId: string;
  mapId: number;
  gameTime: number;
}
