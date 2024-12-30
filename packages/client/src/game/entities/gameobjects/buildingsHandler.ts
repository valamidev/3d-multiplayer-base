import {
  AbstractMesh,
  Mesh,
  Scene,
  SceneLoader,
  Vector3,
} from '@babylonjs/core';

export class BuildingsHandler {
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

  public loadModel(): void {
    SceneLoader.ImportMeshAsync('', '', 'building.glb', this.scene).then(
      (result) => {
        this.mesh = result.meshes[0];

        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.x;
        this.mesh.rotation.y = this.position.x;

        this.mesh.checkCollisions = true;
      }
    );
  }

  public update(): void {}

  private init(): void {
    this.loadModel();
  }
}
