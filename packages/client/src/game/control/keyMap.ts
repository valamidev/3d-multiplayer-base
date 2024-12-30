export enum ControlEvents {
  forward = 'forward',
  turnRight = 'turnRight',
  turnLeft = 'turnLeft',
  clearTurn = 'clearTurn',
  backward = 'backward',
  jump = 'jump',
  strafeLeft = 'strafeLeft',
  strafeRight = 'strafeRight',

  // ArrowKeys
  arrowUp = 'arrowUp',
  arrowDown = 'arrowDown',
  arrowLeft = 'arrowLeft',
  arrowRight = 'arrowRight',
}

export const KeyboardMap: Record<string, ControlEvents> = {
  w: ControlEvents.forward,
  s: ControlEvents.backward,
  a: ControlEvents.turnRight,
  d: ControlEvents.turnLeft,
  [' ']: ControlEvents.jump,
  j: ControlEvents.jump,
  ArrowLeft: ControlEvents.arrowLeft,
  ArrowRight: ControlEvents.arrowRight,
  ArrowUp: ControlEvents.arrowUp,
  ArrowDown: ControlEvents.arrowDown,
};
