import WebSocketClient, { WS_URL } from "./wsClient.js";

const wsClient = new WebSocketClient(
  WS_URL,
  (chat) => {
    // Custom logic here
    console.log(`[Chat] ${chat.username}: ${chat.text}`);
    // e.g., forward to overlay, save to DB, etc.
  },
  (gift) => {
    console.log(`[Gift] ${gift.username} sent a gift!`);
    // Custom logic for gifts
  },
  (like) => {
    console.log(`[Like] ${like.username} liked the stream!`);
    // Custom logic for likes
  },
  (follow) => {
    console.log(`[Follow] ${follow.username} followed!`);
    // Custom logic for follows
  }
);

wsClient.onError = (err) => {
  console.error("WebSocket error:", err);
};

wsClient.onClose = () => {
  console.warn(
    "WebSocket connection closed. Attempting to reconnect in 5 seconds..."
  );
  setTimeout(() => wsClient.connect(), 5000);
};

wsClient.connect();
