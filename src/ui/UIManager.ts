export class UIManager {
  constructor() {
    this.createInstructions();
  }

  private createInstructions() {
    const instructions = document.createElement("div");
    instructions.innerHTML = `
      <h3>Multiplayer First Person Flying Controls:</h3>
      <p><strong>Click</strong> to enable mouse look</p>
      <p><strong>WASD / Arrow Keys</strong> - Move forward/back/left/right</p>
      <p><strong>Space</strong> - Fly up</p>
      <p><strong>Shift/Ctrl</strong> - Fly down</p>
      <p><strong>Mouse</strong> - Look around</p>
      <p><em>Other players appear as red capsules</em></p>
    `;
    instructions.style.position = "absolute";
    instructions.style.top = "10px";
    instructions.style.left = "10px";
    instructions.style.color = "white";
    instructions.style.fontFamily = "Arial, sans-serif";
    instructions.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    instructions.style.padding = "15px";
    instructions.style.borderRadius = "5px";
    instructions.style.pointerEvents = "none";
    document.body.appendChild(instructions);
  }
}
