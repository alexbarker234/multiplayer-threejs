import { Client, getStateCallbacks, Room } from "colyseus.js";
import * as THREE from "three";
import type { GameState } from "../../server/schema/GameState";
import type { PlayerUpdateMessage } from "../types/GameTypes";

export class NetworkManager {
  private client = new Client("ws://localhost:3000");
  private room?: Room<GameState>;
  private otherPlayers = new Map<string, THREE.Mesh>();
  private lastNetworkUpdate = 0;
  private networkUpdateRate = 1000 / 20; // 20 updates per second

  // Player representation geometry
  private playerGeometry = new THREE.CapsuleGeometry(1, 2, 4, 8);
  private playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });

  constructor(private scene: THREE.Scene) {}

  public async connect(): Promise<void> {
    try {
      this.room = await this.client.joinOrCreate("game");
      console.log("Connected to server!");
      this.setupPlayerListeners();
    } catch (error) {
      console.error("Failed to connect to server:", error);
      // Retry connection after a delay
      setTimeout(() => {
        console.log("Retrying connection...");
        this.connect();
      }, 3000);
    }
  }

  private setupPlayerListeners() {
    if (!this.room) return;

    console.log("Setting up player listeners");
    const $ = getStateCallbacks(this.room);

    $(this.room.state).players.onAdd((player, sessionId) => {
      console.log("Player joined:", sessionId);

      // Don't create a visual representation for our own player
      if (sessionId === this.room!.sessionId) return;

      // Create visual representation for other players
      const playerMesh = new THREE.Mesh(this.playerGeometry, this.playerMaterial.clone());
      playerMesh.position.set(player.x, player.y, player.z);
      playerMesh.castShadow = true;
      playerMesh.receiveShadow = true;
      this.scene.add(playerMesh);
      this.otherPlayers.set(sessionId, playerMesh);

      console.log("Added player mesh for:", sessionId, "at position:", player.x, player.y, player.z);

      // Listen for player position updates
      $(player).onChange(() => {
        if (sessionId === this.room!.sessionId) return; // Skip our own player

        const playerMesh = this.otherPlayers.get(sessionId);
        if (playerMesh) {
          // Smoothly interpolate to new position
          playerMesh.position.set(player.x, player.y, player.z);
          playerMesh.rotation.set(player.rotationX, player.rotationY, 0);
        }
      });
    });

    $(this.room.state).players.onRemove((_, sessionId) => {
      console.log("Player left:", sessionId);

      const playerMesh = this.otherPlayers.get(sessionId);
      if (playerMesh) {
        this.scene.remove(playerMesh);
        this.otherPlayers.delete(sessionId);
      }
    });
  }

  public sendPlayerUpdate(position: THREE.Vector3, pitch: number, yaw: number, currentTime: number) {
    if (!this.room || !this.room.state) return;

    // Send network updates at a lower rate
    if (currentTime - this.lastNetworkUpdate > this.networkUpdateRate) {
      const message: PlayerUpdateMessage = {
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        },
        rotation: {
          x: pitch,
          y: yaw
        }
      };

      this.room.send("playerUpdate", message);
      this.lastNetworkUpdate = currentTime;
    }
  }
}
