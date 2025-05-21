import WebSocketClient from "./wsClient.js";

const wsClient = new WebSocketClient(
  "ws://localhost:21213",
  (chat) => console.log(`[Chat] ${chat.username}: ${chat.text}`),
  (gift) => console.log(`[Gift] ${gift.username} sent a gift!`),
  (like) => console.log(`[Like] ${like.username} liked the stream!`),
  (follow) => console.log(`[Follow] ${follow.username} followed!`)
);

wsClient.connect();
