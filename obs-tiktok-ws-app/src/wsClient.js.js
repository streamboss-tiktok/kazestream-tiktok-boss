class WebSocketClient {
  constructor(url, onChat, onGift, onLike, onFollow) {
    this.url = url;
    this.socket = null;
    this.onChat = onChat;
    this.onGift = onGift;
    this.onLike = onLike;
    this.onFollow = onFollow;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  }

  handleMessage(data) {
    try {
      const msg = JSON.parse(data);
      switch (msg.event) {
        case "chat":
          if (msg.data && typeof this.onChat === "function") {
            this.onChat(msg.data);
          }
          break;
        case "gift":
          if (msg.data && typeof this.onGift === "function") {
            this.onGift(msg.data);
          }
          break;
        case "like":
          if (msg.data && typeof this.onLike === "function") {
            this.onLike(msg.data);
          }
          break;
        case "follow":
          if (msg.data && typeof this.onFollow === "function") {
            this.onFollow(msg.data);
          }
          break;
        default:
          console.log("Received message:", msg);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  }
}

export default WebSocketClient;
export const WS_URL = process.env.WS_URL || "ws://localhost:21213";
