import * as THREE from "three";
import type { MovementState } from "../types/GameTypes";

export class PlayerController {
  public movement: MovementState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  };

  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private moveSpeed = 50; // units per second
  private mouseSensitivity = 0.002;

  public pitch = 0;
  public yaw = 0;

  constructor(private camera: THREE.PerspectiveCamera) {
    this.setupControls();
  }

  private setupControls() {
    // Pointer lock for first-person controls
    document.addEventListener("click", () => {
      document.body.requestPointerLock();
    });

    document.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement === document.body) {
        this.yaw -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;

        // Limit pitch to prevent camera flipping
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        // Apply rotation to camera
        this.camera.rotation.order = "YXZ";
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
      }
    });

    // Keyboard controls
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          this.movement.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          this.movement.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.movement.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          this.movement.right = true;
          break;
        case "Space":
          this.movement.up = true;
          event.preventDefault();
          break;
        case "ShiftLeft":
        case "ControlLeft":
          this.movement.down = true;
          event.preventDefault();
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW":
        case "ArrowUp":
          this.movement.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          this.movement.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.movement.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          this.movement.right = false;
          break;
        case "Space":
          this.movement.up = false;
          break;
        case "ShiftLeft":
        case "ControlLeft":
          this.movement.down = false;
          break;
      }
    });
  }

  public update(deltaTime: number) {
    // Reset velocity
    this.velocity.set(0, 0, 0);

    // Calculate movement direction relative to camera
    this.direction.set(0, 0, 0);

    if (this.movement.forward) this.direction.z -= 1;
    if (this.movement.backward) this.direction.z += 1;
    if (this.movement.left) this.direction.x -= 1;
    if (this.movement.right) this.direction.x += 1;
    if (this.movement.up) this.direction.y += 1;
    if (this.movement.down) this.direction.y -= 1;

    // Normalize direction vector
    if (this.direction.length() > 0) {
      this.direction.normalize();

      // Apply camera rotation to movement direction (except for up/down)
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);

      const right = new THREE.Vector3();
      right.crossVectors(cameraDirection, this.camera.up).normalize();

      const forward = new THREE.Vector3();
      forward.crossVectors(this.camera.up, right).normalize();

      // Calculate final velocity
      this.velocity.addScaledVector(forward, -this.direction.z);
      this.velocity.addScaledVector(right, this.direction.x);
      this.velocity.y = this.direction.y;

      this.velocity.multiplyScalar(this.moveSpeed * deltaTime);

      // Apply movement to camera
      this.camera.position.add(this.velocity);
    }
  }
}
