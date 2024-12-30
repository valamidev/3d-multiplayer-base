import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  DirectionalLight,
  ShadowGenerator,
  Color3,
} from '@babylonjs/core';

import '@babylonjs/inspector';
import { CharacterHandler } from './game/entities/characters/character';

import { NetworkHandler } from './game/network/networkHandler';
import {
  CMSG_CHARACTER_SET_ACTIVE,
  NETWORK_EVENTS,
} from '../../shared/src/networkPackets';
import { LightsHandler } from './game/handlers/reflections/ligths';
import { MainWorldUpdate } from './game/core/mainUpdate';

export class BabylonScene {
  private engine: Engine;
  private scene: Scene;
  private networkHandler: NetworkHandler;
  lightsHandler: any;
  private mainWorldUpdate: MainWorldUpdate;

  constructor(private canvas: HTMLCanvasElement) {
    this.networkHandler = NetworkHandler.getInstance();
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);

    this.lightsHandler = LightsHandler.create(this.scene);

    this.scene.collisionsEnabled = true;

    this.mainWorldUpdate = new MainWorldUpdate(this.scene);

    this.initScene();
  }

  private async initScene(): Promise<void> {
    // Then modify the debug layer initialization:
    try {
      // Check if debug layer is supported
      if (this.scene.debugLayer.isVisible()) {
        this.scene.debugLayer.hide();
      } else {
        this.scene.debugLayer.show({
          embedMode: true,
          showInspector: false,
        });
      }
    } catch (error) {
      console.warn('Debug layer failed to load:', error);
    }

    // Ambient Light
    const hemiLight = new HemisphericLight(
      'hemiLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.5;
    hemiLight.groundColor = new Color3(0.2, 0.2, 0.2);

    // Light
    const light = new DirectionalLight(
      'spotLight',
      new Vector3(-1, -2, -1),
      this.scene
    );
    light.position = new Vector3(200, 400, 200);
    light.intensity = 1;

    const shadowGenerator = new ShadowGenerator(1024, light);

    shadowGenerator.useExponentialShadowMap = true;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurScale = 2;
    shadowGenerator.setDarkness(0.6);

    // Optional: Enable PCF shadows for better quality
    shadowGenerator.usePercentageCloserFiltering = true;

    this.lightsHandler.addShadowGenerator('spotLight', shadowGenerator);

    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: 1000,
        height: 1000,
      },
      this.scene
    );

    // Enable shadow receiving on meshes that should receive shadows
    ground.receiveShadows = true;

    ground.checkCollisions = true;

    // Create material and texture for ground
    const groundMaterial = new StandardMaterial('groundMaterial', this.scene);
    const grassTexture = new Texture('grassText.png', this.scene);

    this.scene.debugLayer.show({
      embedMode: true,
      showInspector: false,
    });

    // Or alternatively, for just FPS counter, add after scene creation:
    const divFps = document.getElementById('fps');
    // Add stats to the scene
    this.scene.registerBeforeRender(() => {
      if (divFps) {
        divFps.innerHTML = this.engine.getFps().toFixed() + ' fps';
      }
    });

    // Set texture to repeat many times across the surface
    grassTexture.uScale = 100;
    grassTexture.vScale = 100;

    // Apply texture to material
    groundMaterial.diffuseTexture = grassTexture;

    // Assign material to ground mesh
    ground.material = groundMaterial;

    const uniqueCharacterId = Math.floor(Math.random() * 1000000);

    this.mainWorldUpdate.activeCharacterGuid = uniqueCharacterId;

    setInterval(() => {
      this.networkHandler.sendToServer<CMSG_CHARACTER_SET_ACTIVE>({
        event: NETWORK_EVENTS.CMSG_CHARACTER_SET_ACTIVE,
        guid: uniqueCharacterId,
        mapId: 1,
      });
    }, 100);

    const character = new CharacterHandler({
      scene: this.scene,
      shadowGenerator: shadowGenerator,
      guid: Number(uniqueCharacterId),
      position: new Vector3(50, 50, 50),
      callback: () => {
        //characterCamera.setActive(Number(1));
      },
    });

    character.setAvatar();

    this.scene.meshes.forEach((m) => {
      m.showBoundingBox = true;
    });

    // Render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}

window.onload = async () => {
  // Add this after your existing initialization code
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  document.body.appendChild(canvas);

  const babylonScene = new BabylonScene(canvas);

  // Optional: Clean up on page unload
  window.addEventListener('beforeunload', () => {
    babylonScene.dispose();
  });
};
