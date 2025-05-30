import { PlayerController } from "./controls/PlayerController";
import { GameLoop } from "./core/GameLoop";
import { NetworkManager } from "./network/NetworkManager";
import { SceneManager } from "./scene/SceneManager";
import "./style.css";
import { UIManager } from "./ui/UIManager";

class Game {
  private sceneManager: SceneManager;
  private playerController: PlayerController;
  private networkManager: NetworkManager;
  // @ts-ignore
  private uiManager: UIManager;
  private gameLoop: GameLoop;

  constructor() {
    this.sceneManager = new SceneManager();
    this.playerController = new PlayerController(this.sceneManager.camera);
    this.networkManager = new NetworkManager(this.sceneManager.scene);
    this.uiManager = new UIManager();

    this.gameLoop = new GameLoop(
      (deltaTime, currentTime) => this.update(deltaTime, currentTime),
      () => this.render()
    );
  }

  private update(deltaTime: number, currentTime: number) {
    this.playerController.update(deltaTime);
    this.sceneManager.updateCubes(deltaTime);
    this.networkManager.update(deltaTime);

    // Send network updates
    this.networkManager.sendPlayerUpdate(
      this.sceneManager.camera.position,
      this.playerController.pitch,
      this.playerController.yaw,
      currentTime
    );
  }

  private render() {
    this.sceneManager.render();
  }

  public async start() {
    await this.networkManager.connect();
    this.gameLoop.start();
  }
}

const game = new Game();
game.start();
