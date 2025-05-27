// Connect to TikFinity WebSocket
const socket = new WebSocket("ws://localhost:21213/");

// Boss state
const boss = {
  name: "???",
  hp: 2000,
  maxHp: 2000,
  shield: 0,
  spriteIndex: 1,
};

const leaderboard = {}; // { username: totalDamage }
const bossSprites = 14; // Number of boss images (Boss1.png ... Boss14.png)

function updateHP() {
  const hpBar = document.getElementById("hpBar");
  hpBar.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
  hpBar.textContent = `HP: ${boss.hp}/${boss.maxHp}`;
  if (boss.hp <= 0) {
    hpBar.style.background = "#e74c3c";
  } else if (boss.hp < boss.maxHp * 0.3) {
    hpBar.style.background = "#f1c40f";
  } else {
    hpBar.style.background = "#27ae60";
  }
}

function updateShield() {
  const shieldBar = document.getElementById("shieldBar");
  shieldBar.style.width = `${(boss.shield / boss.maxHp) * 100}%`;
  shieldBar.textContent = boss.shield > 0 ? `Shield: ${boss.shield}` : "";
  shieldBar.style.background = boss.shield > 0 ? "#3498db" : "transparent";
}

function setBossName(name) {
  boss.name = name;
  const bossNameDiv = document.getElementById("bossName");
  if (bossNameDiv)
    bossNameDiv.textContent = name ? `Boss: ${name}` : "Boss: ???";
}

function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function updateBossSprite() {
  const streamBoss = document.getElementById("streamBoss");
  streamBoss.innerHTML = "";
  const img = document.createElement("img");
  img.id = "bossSprite";
  img.src = `assets/images/Boss${boss.spriteIndex}.png`;
  img.alt = "Boss Sprite";
  img.style.width = "256px";
  img.style.height = "256px";
  img.style.transition = "filter 0.2s";
  streamBoss.appendChild(img);
}

function bossHitEffect() {
  const img = document.getElementById("bossSprite");
  if (img) {
    img.style.filter = "brightness(2) drop-shadow(0 0 10px red)";
    setTimeout(() => {
      img.style.filter = "";
    }, 200);
  }
}

function updateLeaderboard(user, damage) {
  if (user) {
    leaderboard[user] = (leaderboard[user] || 0) + damage;
  }
  const lbDiv = document.getElementById("leaderboard");
  const topAttackerDiv = document.getElementById("topAttacker");
  const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);
  if (lbDiv) {
    lbDiv.innerHTML = "<b>Top Attackers:</b><br>" +
      sorted
        .slice(0, 5)
        .map(([u, d]) => `${u}: ${d}`)
        .join("<br>");
  }
  if (topAttackerDiv) {
    if (sorted.length > 0) {
      topAttackerDiv.textContent = `${sorted[0][0]} is currently the top attacker`;
    } else {
      topAttackerDiv.textContent = "";
    }
  }
}

function activateShield(amount) {
  boss.shield = amount;
  updateShield();
  playSound("shieldOnSound");
}

function depleteShield() {
  boss.shield = 0;
  updateShield();
  playSound("shieldDepletedSound");
}

function handleBossDefeat(newBossName) {
  playSound("killSound");
  boss.name = newBossName || boss.name;
  boss.hp = boss.maxHp;
  boss.spriteIndex = Math.floor(Math.random() * bossSprites) + 1;
  setBossName(boss.name);
  updateBossSprite();
  Object.keys(leaderboard).forEach(k => delete leaderboard[k]);
  updateLeaderboard();
}

function getDisplayName(data) {
  return data.displayName || data.username || "User";
}

function handleEvent(user, type, amount) {
  let damage = 0;

  // If boss is still ???, set the first attacker as boss
  if (boss.name === "???") {
    setBossName(user);
  }

  if (type === "gift") damage = 100 * amount;
  else if (type === "like") damage = 10 * amount;
  else if (type === "share") damage = 50 * amount;
  else if (type === "follow") damage = 25 * amount;
  else if (type === "subscribe") damage = 200 * amount;

  // Shield logic
  if (boss.shield > 0) {
    if (boss.shield >= damage) {
      boss.shield -= damage;
      damage = 0;
      playSound("hitSound");
      updateShield();
      if (boss.shield === 0) depleteShield();
    } else {
      damage -= boss.shield;
      boss.shield = 0;
      depleteShield();
    }
  }

  if (damage > 0) {
    boss.hp -= damage;
    bossHitEffect();
    playSound("hitSound");
    updateLeaderboard(user, damage);
  }

  // If boss is defeated, the attacker becomes the new boss
  if (boss.hp <= 0) {
    setBossName(user);
    handleBossDefeat(user);
  }

  updateHP();
  updateShield();
}

function addChatMessage(username, message) {
  let chatBox = document.getElementById("chatBox");
  if (!chatBox) {
    chatBox = document.createElement("div");
    chatBox.id = "chatBox";
    document.body.appendChild(chatBox);
  }
  const div = document.createElement("div");
  div.textContent = `${username}: ${message}`;
  chatBox.appendChild(div);
  if (chatBox.children.length > 10) chatBox.removeChild(chatBox.firstChild);
}

// Handle TikFinity events
socket.onmessage = function (event) {
  try {
    const message = JSON.parse(event.data);
    const data = message.data || {};

    switch (message.event) {
      case "gift":
        handleEvent(getDisplayName(data), "gift", data.amount || 1);
        break;
      case "like":
        handleEvent(getDisplayName(data), "like", data.amount || 1);
        break;
      case "share":
        handleEvent(getDisplayName(data), "share", data.amount || 1);
        break;
      case "follow":
        handleEvent(getDisplayName(data), "follow", data.amount || 1);
        break;
      case "subscribe":
        handleEvent(getDisplayName(data), "subscribe", data.amount || 1);
        break;
      case "chat":
        addChatMessage(getDisplayName(data), data.comment || "");
        break;
      case "shield":
        activateShield(data.amount || boss.maxHp / 2);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("Invalid WebSocket message:", event.data);
  }
};

window.onload = function () {
  updateHP();
  updateShield();
  setBossName(boss.name);
  updateBossSprite();
  updateLeaderboard();

};};
