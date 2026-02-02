// main.js (WebSocket disabled permanently)

// This file intentionally left minimal.
// Old WebSocket signaling has been removed.

// Safety guard in case anything references socket
window.socket = null;

console.log("main.js loaded — WebSocket disabled");
