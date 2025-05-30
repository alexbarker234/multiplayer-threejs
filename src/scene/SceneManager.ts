import * as THREE from "three";

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public cubes: THREE.Mesh[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // sky blue background

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createEnvironment();
    this.setupEventListeners();
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private createEnvironment() {
    // Create scattered grey cubes
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshToonMaterial({ color: 0x808080 });

    const numCubes = 50;
    for (let i = 0; i < numCubes; i++) {
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

      // Random position within a range
      cube.position.x = (Math.random() - 0.5) * 200;
      cube.position.y = (Math.random() - 0.5) * 100;
      cube.position.z = (Math.random() - 0.5) * 200;

      // Random rotation
      cube.rotation.x = Math.random() * Math.PI;
      cube.rotation.y = Math.random() * Math.PI;
      cube.rotation.z = Math.random() * Math.PI;

      cube.castShadow = true;
      cube.receiveShadow = true;

      this.cubes.push(cube);
      this.scene.add(cube);
    }

    // Ground plane for reference
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshToonMaterial({ color: 0x228b22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private setupEventListeners() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public updateCubes(deltaTime: number) {
    this.cubes.forEach((cube, index) => {
      cube.rotation.x += 0.01 * deltaTime * (index % 2 === 0 ? 1 : -1);
      cube.rotation.y += 0.01 * deltaTime;
    });
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }
}
