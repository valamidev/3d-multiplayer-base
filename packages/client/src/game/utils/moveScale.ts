export const moveScale = (
  speed: number,
  updateInterval: number,
  lastUpdate: number
) => {
  const now = Date.now();
  const elapsed = now - lastUpdate;

  return (speed * elapsed) / updateInterval;
};
