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

function updateBars() {
  document.getElementById("health-bar").style.width =
    (currentHealth / MAX_HEALTH) * 100 + "%";
  document.getElementById("shield-bar").style.width =
    (shield / MAX_HEALTH) * 100 + "%";
}
function showCurrentBossAndBoss() {
  // Show Boss sprite on canvas
  showBossOnCanvas(currentBoss);
  // Only show the boss username below the sprite, no Boss name or Boss image
  document.getElementById("Boss-name").innerHTML = `
    <span class="boss-username">${bossName}</span>
  `;
  document.getElementById("boss-name").textContent = `Boss: ${bossName}`;
}

function setBossSprite(index) {
  const bossesDiv = document.getElementById("boss-bosses");
  bossesDiv.innerHTML = "";
  const name = BossNames[index];
  const img = document.createElement("img");
  img.src = `assets/images/${name}.png`;
  img.alt = "Boss Sprite";
  img.className = "boss-sprite";
  img.id = `boss-${name}`;
  bossesDiv.appendChild(img);

  // Show only the boss username below the sprite
  let bossNameDiv = document.getElementById("boss-name");
  if (!bossNameDiv) {
    bossNameDiv = document.createElement("div");
    bossNameDiv.id = "boss-name";
    bossesDiv.parentNode.insertBefore(bossNameDiv, bossesDiv.nextSibling);
  }
  bossNameDiv.innerHTML = `<span class="boss-username">${bossName}</span>`;
}

const BossNames = Array.from({ length: 14 }, (_, i) => `Boss${i + 1}`);

function showHowToPlayTemporarily() {
  const howToPlay = document.getElementById("how-to-play");
  howToPlay.style.display = "block";
  clearTimeout(showHowToPlayTemporarily._timeout);
  showHowToPlayTemporarily._timeout = setTimeout(() => {
    howToPlay.style.display = "none";
  }, 5000);
}

// On initial load
showHowToPlayTemporarily();

// On boss respawn (e.g., in your bossReset handler)
socket.on("bossReset", ({ newBossIndex, newBossUsername }) => {
  // ...existing boss reset logic...
  showHowToPlayTemporarily();
});

const socket = new WebSocket("ws://localhost:21213/");

// Example boss state and hit handler
const boss = {
  name: "???",
  hp: 2000,
  maxHp: 2000,
  shield: 0,
  cooldown: false,
};

function handleEvent({ user, type, amount }) {
  // Your logic to update boss state, leaderboard, etc.
  console.log(`Event: ${type} from ${user} (${amount})`);
}

function onBossHit() {
  // Your animation or UI update logic
  console.log("Boss was hit!");
}

socket.onopen = () => {
  console.log("WebSocket connected");
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (["coin", "like", "share"].includes(data.type)) {
      handleEvent({
        user: data.user || "Viewer",
        type: data.type,
        amount: data.amount || 1,
      });
      onBossHit();
    }
    if (data.type === "giftReceived") {
      console.log("Gift received on overlay:", data);
      onBossHit();
    }
    // Handle other event types as needed
  } catch (e) {
    console.error("Invalid event", e);
  }
};

socket.onerror = (err) => {
  console.error("WebSocket error:", err);
};

socket.onclose = () => {
  console.log("WebSocket disconnected");
};
