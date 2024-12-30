export interface ICharacterState {
  guid: number;
  position: { _x: number; _y: number; _z: number };
  orientation: number;
  moveSpeed: number;
  moveVector: { _x: number; _y: number; _z: number };
  state: string;
}
