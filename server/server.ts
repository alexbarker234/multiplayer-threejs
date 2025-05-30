import { Server } from "colyseus";
import { GameRoom } from "./rooms/GameRoom";

const port = parseInt(process.env.PORT || "3000", 10);

// Create Colyseus server
const gameServer = new Server();

// Register the GameRoom
gameServer.define("game", GameRoom);

// Start the server
gameServer.listen(port);
console.log(`[GameServer] Listening on Port: ${port}`);
