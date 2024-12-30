import { NETWORK_EVENTS } from 'base3dmulti-shared/src/networkPackets';

import { WorldState } from './worldUpdate';

import { DEFAULT_PORT } from './constants';
import { loadSessions, updateSession } from './states/statesStore';
import { GenerateSessionGuid } from './utils/utils';

const bootstrap = async () => {
  const worldState = new WorldState();
  const Emitter = worldState.emitter;

  Bun.serve({
    port: DEFAULT_PORT,
    fetch(req, server) {
      if (server.upgrade(req)) {
        return;
      }
      return new Response('Server running!');
    },
    websocket: {
      open(ws) {
        const sessionId = GenerateSessionGuid();
        loadSessions(ws, sessionId);
        ws.data = { sessionId };
        ws.send(
          JSON.stringify({
            event: NETWORK_EVENTS.MSG_AUTH,
            sessionId,
          })
        );

        Emitter.emit(NETWORK_EVENTS.WS_OPEN_CONNECTION, {
          sessionId,
        });

        console.log('Client connected, sessionId:', sessionId);
      },
      message(ws, message) {
        const parsedMessage = JSON.parse(message as string);

        updateSession((ws.data as any).sessionId);

        const { event, ...payload } = parsedMessage;

        switch (event) {
          case NETWORK_EVENTS.MSG_PING:
            ws.send(
              JSON.stringify({
                event: NETWORK_EVENTS.MSG_PONG,
                senderTime: payload.senderTime,
              })
            );
            break;
          case NETWORK_EVENTS.MSG_PONG:
            updateSession((ws.data as any).sessionId, {
              latency: Date.now() - payload.senderTime,
            });
            break;
          case NETWORK_EVENTS.CMSG_CHARACTER_SET_ACTIVE:
            updateSession((ws.data as any).sessionId, {
              characterId: payload.guid,
              mapId: payload.mapId,
            });
            break;
          case NETWORK_EVENTS.CMSG_CHARACTER_UPDATE:
          case NETWORK_EVENTS.MSG_CHARACTER_MOVE_START:
          case NETWORK_EVENTS.MSG_CHARACTER_MOVE_STOP:
            Emitter.emit(event, payload);
            break;
          case NETWORK_EVENTS.MSG_CHARACTER_TURN:
            Emitter.emit(NETWORK_EVENTS.MSG_CHARACTER_TURN, payload);
            break;
          case NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START:
            Emitter.emit(NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START, payload);
            break;
        }
      },
      close(ws) {
        Emitter.emit(NETWORK_EVENTS.WS_CLOSE_CONNECTION, {
          sessionId: (ws.data as any).sessionId,
        });
      },
    },
  });

  console.log(`WebSocket server listening on port ${DEFAULT_PORT}`);
};

bootstrap()
  .catch((err) => console.error)
  .then(() => {
    console.log('Bun Server Started');
  });
