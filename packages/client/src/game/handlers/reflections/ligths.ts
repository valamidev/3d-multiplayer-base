import {
  DirectionalLight,
  HemisphericLight,
  Scene,
  ShadowGenerator,
} from "@babylonjs/core";
import EventEmitter from "eventemitter3";

export class LightsHandler extends EventEmitter {
  static instance: LightsHandler;
  private scene!: Scene;
  public shadowGenerators: Map<string, ShadowGenerator> = new Map();
  public lights: Map<string, HemisphericLight | DirectionalLight> = new Map();

  public static create(scene: Scene): LightsHandler {
    if (!LightsHandler.instance) {
      LightsHandler.instance = new LightsHandler(scene);
    }
    return LightsHandler.instance;
  }

  public static getInstance(): LightsHandler {
    return LightsHandler.instance;
  }

  constructor(scene: Scene) {
    super();
    this.scene = scene;
  }

  addLight(name: string, light: DirectionalLight): void {
    this.scene.addLight(light);
    this.lights.set(name, light);
  }

  addShadowGenerator(name: string, shadowGenerator: ShadowGenerator): void {
    this.shadowGenerators.set(name, shadowGenerator);
  }

  getShadowGenerators(name: string): ShadowGenerator {
    return this.shadowGenerators.get(name)!;
  }
}
