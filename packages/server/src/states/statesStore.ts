import { ServerWebSocket } from 'bun';

import { DEFAULT_LATENCY } from '../constants';
import { ICharacterStateServer, ISessionState } from './interface';

export const SessionStateMap: Map<string, ISessionState> = new Map();

export const loadSessions = (
  _ws: ServerWebSocket<unknown>,
  sessionId: string
) => {
  const session = SessionStateMap.has(sessionId);
  if (session) {
    return;
  }
  SessionStateMap.set(sessionId, {
    sessionId: sessionId,
    ws: _ws,
    mapId: 1,
    lastUpdate: Date.now(),
    characterId: 0,
    latency: DEFAULT_LATENCY,
  });
};

export const updateSession = (sessionId: string, update = {}) => {
  const session = SessionStateMap.get(sessionId);

  if (session) {
    SessionStateMap.set(sessionId, {
      ...session,
      ...update,
      lastUpdate: Date.now(),
    });
  }
};

export const CharacterStateMap: Map<number, ICharacterStateServer> = new Map();

export const clearPlayerFromStateStores = (characterId: number) => {
  CharacterStateMap.delete(characterId);
};

export const findSessionByCharacterId = (characterId: number) => {
  for (const [_, session] of SessionStateMap) {
    if (session.characterId === characterId) {
      return session;
    }
  }
};
