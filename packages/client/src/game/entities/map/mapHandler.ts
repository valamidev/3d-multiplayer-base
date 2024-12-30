import {
  AbstractMesh,
  Mesh,
  Scene,
  SceneLoader,
  Vector3,
} from '@babylonjs/core';

export class MapHandler {
  protected position!: Vector3;
  private mesh!: AbstractMesh;

  constructor(private scene: Scene, protected guid: number, position: Vector3) {
    this.position = position;
    this.init();
  }

  public setPosition(position: Vector3): void {
    this.position = position;
    this.mesh.position = this.position;
  }

  public load(): void {
    SceneLoader.ImportMeshAsync('', '', 'map.glb').then((result) => {
      this.mesh = result.meshes[0];

      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.x;
      this.mesh.rotation.y = this.position.x;

      this.mesh.scaling = new Vector3(2, 2, 2);

      this.mesh.checkCollisions = true;
    });
  }

  public update(): void {}

  private init(): void {
    this.load();
  }
}
