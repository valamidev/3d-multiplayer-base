export const GAME_TIME = {
  offset: 0,
  latency: 0,
  get now() {
    return Date.now() - this.offset - this.latency;
  },
};

export const SyncLatency = (latency: number) => {
  GAME_TIME.latency = latency;
};

export const SyncGameTime = (serverTime: number) => {
  GAME_TIME.offset = Date.now() - serverTime;
};
