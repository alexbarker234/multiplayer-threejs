import { Client, getStateCallbacks, Room } from "colyseus.js";
import * as THREE from "three";
import type { GameState } from "../../server/schema/GameState";
import type { PlayerUpdateMessage } from "../types/GameTypes";

interface OtherPlayer {
  mesh: THREE.Mesh;
  lastPosition: THREE.Vector3;
  desiredPosition: THREE.Vector3;
  lastRotation: { x: number; y: number };
  desiredRotation: { x: number; y: number };
}

export class NetworkManager {
  private client = new Client("ws://localhost:3000");
  private room?: Room<GameState>;
  private otherPlayers = new Map<string, OtherPlayer>();
  private lastNetworkUpdate = 0;
  private networkUpdateRate = 1000 / 20; // 20 updates per second

  // Player representation geometry
  private playerGeometry = new THREE.CapsuleGeometry(1, 2, 4, 8);
  private playerMaterial = new THREE.MeshToonMaterial({ color: 0xff6b6b });

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

      const otherPlayer: OtherPlayer = {
        mesh: playerMesh,
        lastPosition: new THREE.Vector3(player.x, player.y, player.z),
        desiredPosition: new THREE.Vector3(player.x, player.y, player.z),
        lastRotation: { x: player.rotationX, y: player.rotationY },
        desiredRotation: { x: player.rotationX, y: player.rotationY }
      };

      this.otherPlayers.set(sessionId, otherPlayer);

      $(player).onChange(() => {
        if (sessionId === this.room!.sessionId) return;

        const otherPlayer = this.otherPlayers.get(sessionId);
        if (otherPlayer) {
          // Update last position to current position before setting new desired position
          otherPlayer.lastPosition.copy(otherPlayer.mesh.position);
          otherPlayer.lastRotation = { ...otherPlayer.desiredRotation };

          // Set new desired position and rotation
          otherPlayer.desiredPosition.set(player.x, player.y, player.z);
          otherPlayer.desiredRotation = { x: player.rotationX, y: player.rotationY };
        }
      });
    });

    $(this.room.state).players.onRemove((_, sessionId) => {
      console.log("Player left:", sessionId);

      const otherPlayer = this.otherPlayers.get(sessionId);
      if (otherPlayer) {
        this.scene.remove(otherPlayer.mesh);
        this.otherPlayers.delete(sessionId);
      }
    });
  }

  public update(deltaTime: number) {
    // Interpolate positions and rotations for all other players
    const interpolationSpeed = 20;

    this.otherPlayers.forEach((otherPlayer) => {
      // Interpolate position
      otherPlayer.mesh.position.lerp(otherPlayer.desiredPosition, interpolationSpeed * deltaTime);

      // Interpolate rotation using slerp
      const rotationSlerpFactor = interpolationSpeed * deltaTime;

      const currentQuaternion = new THREE.Quaternion();
      currentQuaternion.setFromEuler(otherPlayer.mesh.rotation);

      const desiredQuaternion = new THREE.Quaternion();
      desiredQuaternion.setFromEuler(
        new THREE.Euler(otherPlayer.desiredRotation.x, otherPlayer.desiredRotation.y, 0, "YXZ")
      );

      currentQuaternion.slerp(desiredQuaternion, rotationSlerpFactor);

      otherPlayer.mesh.setRotationFromQuaternion(currentQuaternion);
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
