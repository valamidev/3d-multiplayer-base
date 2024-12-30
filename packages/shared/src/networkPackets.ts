export enum NETWORK_EVENTS {
  // Server Layer events
  WS_CLOSE_CONNECTION = 'WS_CLOSE_CONNECTION',
  WS_OPEN_CONNECTION = 'WS_OPEN_CONNECTION',
  // Service Evens
  MSG_PONG = 'PONG',
  MSG_PING = 'PING',
  MSG_AUTH = 'AUTH',
  MSG_SERVER_TIME_SYNC = 'SERVER_TIME_SYNC',

  // Proxy events can be broadcasted without any limit
  MSG_CHARACTER_TURN = 'MSG_CHARACTER_TURN',
  MSG_CHARACTER_MOVE_START = 'MSG_CHARACTER_MOVE_START',
  MSG_CHARACTER_MOVE_STOP = 'MSG_CHARACTER_MOVE_STOP',
  MSG_CHARACTER_SPLINE_START = 'MSG_CHARACTER_SPLINE_START',
  MSG_CHARACTER_SPLINE_STOP = 'MSG_CHARACTER_SPLINE_STOP',

  // Client Events
  CMSG_CHARACTER_SET_ACTIVE = 'CMSG_CHARACTER_SET_ACTIVE',
  CMSG_CHARACTER_UPDATE = 'CMSG_CHARACTER_UPDATE',

  // Server Events
  SMSG_CHARACTER_UPDATE = 'SMSG_CHARACTER_UPDATE',
  SMSG_CHARACTER_REMOVE = 'SMSG_CHARACTER_REMOVE',
}

export interface WS_CLOSE_CONNECTION {
  sessionId: string;
}

export interface WS_OPEN_CONNECTION {
  sessionId: string;
}

export interface SMSG_AUTH {
  event: NETWORK_EVENTS.MSG_AUTH;
}

export interface MSG_PONG {
  event: NETWORK_EVENTS.MSG_PONG;
  senderTime: number;
}

export interface MSG_PING {
  event: NETWORK_EVENTS.MSG_PING;
  senderTime: number;
}

export interface SMSG_CHARACTER_REMOVE {
  guid: number;
}

export interface CMSG_CHARACTER_UPDATE {
  event: NETWORK_EVENTS.CMSG_CHARACTER_UPDATE;
  guid: number;
  position: { _x: number; _y: number; _z: number };
  orientation: number;
  state: string;
  moveSpeed: number;
  moveVector: { _x: number; _y: number; _z: number };
  gameTime: number;
}

export interface SMSG_CHARACTER_UPDATE {
  event: NETWORK_EVENTS.SMSG_CHARACTER_UPDATE;
  guid: number;
  position: { _x: number; _y: number; _z: number };
  orientation: number;
  state: string;
  moveSpeed: number;
  moveVector: { _x: number; _y: number; _z: number };
}

export interface CMSG_CHARACTER_SET_ACTIVE {
  event: NETWORK_EVENTS.CMSG_CHARACTER_SET_ACTIVE;
  mapId: number;
  guid: number;
}

export interface MSG_CHARACTER_MOVE_START {
  event: NETWORK_EVENTS.MSG_CHARACTER_MOVE_START;
  guid: number;
  orientation: number;
  position: { _x: number; _y: number; _z: number };
  moveSpeed: number;
  moveVector: { _x: number; _y: number; _z: number };
  state: string;
  gameTime: number;
}

export interface MSG_CHARACTER_MOVE_STOP {
  event: NETWORK_EVENTS.MSG_CHARACTER_MOVE_STOP;
  guid: number;
  orientation: number;
  position: { _x: number; _y: number; _z: number };
  moveVector: { _x: number; _y: number; _z: number };
  moveSpeed: number;
  state: string;
  gameTime: number;
}

export interface MSG_CHARACTER_SPLINE_START {
  event: NETWORK_EVENTS.MSG_CHARACTER_SPLINE_START;
  guid: number;
  splineStartTime: number;
  initialVelocity: number;
  splineDirection: { _x: number; _y: number; _z: number };
  movePOV: { _x: number; _y: number; _z: number };
  moveVector: { _x: number; _y: number; _z: number };
  moveSpeed: number;
  gameTime: number;
}

export interface MSG_CHARACTER_TURN {
  event: NETWORK_EVENTS.MSG_CHARACTER_TURN;
  guid: number;
  orientation: number;
  moveSpeed: number;
  gameTime: number;
}
