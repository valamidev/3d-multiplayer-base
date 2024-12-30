import { NETWORK_EVENTS } from 'base3dmulti-shared/src/networkPackets';

export const GenerateSessionGuid = () => `${Math.random()}:${Date.now()}`;

export const castPacket = (event: NETWORK_EVENTS, payload: any) => {
  return {
    event,
    ...payload,
  };
};
