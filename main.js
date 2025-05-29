const boss = {
  name: "???",
  hp: 2000,
  maxHp: 2000,
  shield: 0,
  spriteIndex: 1,
};

const leaderboard = {}; // { username: totalDamage }
const bossSprites = 14; // Number of boss images (Boss1.png ... Boss14.png)
const viewers = new Set();
let shieldCooldown = false;
let shieldCooldown = false;

// Connect to TikFinity WebSocket
const socket = new WebSocket("ws://localhost:21213/");

// --- UI Update Functions ---

function updateHP() {
  const hpBar = document.getElementById("hpBar");
  if (hpBar && boss.maxHp) {
    hpBar.style.width = `${(boss.hp / boss.maxHp) * 100}%`;
    hpBar.textContent = `HP: ${boss.hp}/${boss.maxHp}`;
  }
}

function updateShield() {
  const shieldBar = document.getElementById("shieldBar");
  if (shieldBar && boss.maxHp) {
    shieldBar.style.width = `${(boss.shield / boss.maxHp) * 100}%`;
    shieldBar.textContent = boss.shield > 0 ? `Shield: ${boss.shield}` : "";
    shieldBar.style.background = boss.shield > 0 ? "#3498db" : "transparent";
  }
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
  if (streamBoss) {
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
    lbDiv.innerHTML =
      "<b>Top Attackers:</b><br>" +
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
  Object.keys(leaderboard).forEach((k) => delete leaderboard[k]);
  updateLeaderboard();
}

function getDisplayName(data) {
  return (
    data.displayName ||
    data.username ||
    data.uniqueId ||
    data.nickname ||
    data.userId ||
    (data.user &&
      (data.user.displayName ||
        data.user.username ||
        data.user.uniqueId ||
        data.user.nickname ||
        data.user.userId)) ||
    "User"
  );
}

function handleEvent(user, type, amount) {
  let damage = 0;

  // If boss is still ???, set the first attacker as boss
  if (boss.name === "???") {
    setBossName(user);
  }

 // Damage calculation
if (type === "gift") damage = 100 * amount;
else if (type === "like") damage = 10 * amount;
else if (type === "share") damage = 50 * amount;
else if (type === "follow") damage = 25 * amount;
else if (type === "subscribe") damage = 200 * amount;

// Shield activation for high-value gifts
if (!shieldCooldown && boss.shield === 0 && type === "gift" && amount >= 299) {
    boss.shield = 2000; // Shield HP equals full boss HP
    console.log(`${boss.name} activated a shield from a high-value gift!`);
    updateShield();
    playSound("shieldOnSound");
}

    function depleteShield() {
  boss.shield = 0;
  updateShield();
  playSound("shieldDepletedSound");
  startShieldCooldown();  // Start the 5-minute cooldown when the shield depletes
}

  function startShieldCooldown() {
  shieldCooldown = true;
  setTimeout(() => {
    shieldCooldown = false;
    console.log(`Shield is ready to be activated again.`);
  }, 300000); // 5-minute cooldown
}

        updateShield();
        playSound("shieldDepletedSound");
    }, 7000);

  let shieldCooldown = false;
}

function handleEvent(user, type, amount) {
  let damage = 0;

  // If boss is still ???, set the first attacker as boss
  if (boss.name === "???") {
    setBossName(user);
  }

  // Damage calculation
  if (type === "gift") damage = 100 * amount;
  else if (type === "like") damage = 10 * amount;
  else if (type === "share") damage = 50 * amount;
  else if (type === "follow") damage = 25 * amount;
  else if (type === "subscribe") damage = 200 * amount;

  // Shield activation for high-value gifts:
  // Activate shield if none exists and not in cooldown
  if (!shieldCooldown && boss.shield === 0 && type === "gift" && amount >= 299) {
    boss.shield = 2000; // Set shield to full boss HP
    console.log(`${boss.name} activated a shield from a high-value gift!`);
    updateShield();
    playSound("shieldOnSound");
  }

  // Shield logic for absorbing damage
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

  // Apply any damage to the boss HP if left over
  if (damage > 0) {
    boss.hp -= damage;
    bossHitEffect();
    playSound("hitSound");
    updateLeaderboard(user, damage);
  }

  // If boss is defeated, assign new boss logic
  if (boss.hp <= 0) {
    setBossName(user);
    handleBossDefeat(user);
  }

  updateHP();
  updateShield();
}


}
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
    chatBox.style.position = "absolute";
    chatBox.style.bottom = "10px";
    chatBox.style.left = "10px";
    chatBox.style.maxWidth = "300px";
    chatBox.style.maxHeight = "200px";
    chatBox.style.overflowY = "auto";
    chatBox.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    chatBox.style.color = "white";
    chatBox.style.padding = "10px";
    chatBox.style.borderRadius = "5px";
    document.body.appendChild(chatBox);
  }

  const messageDiv = document.createElement("div");
  messageDiv.textContent = `${username}: ${message}`;
  messageDiv.style.marginBottom = "5px";
  chatBox.appendChild(messageDiv);

  // Scroll to the bottom of the chat box
  chatBox.scrollTop = chatBox.scrollHeight;
}

// --- WebSocket Event Handling ---

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Data received:", data);

  if (data.type === "bossStats") {
    boss.hp = data.hp;
    boss.maxHp = data.maxHp;
    boss.shield = data.shield;
    boss.spriteIndex = data.spriteIndex;
    updateHP();
    updateShield();
    updateBossSprite();
  } else if (data.type === "playerDamage") {
    updateLeaderboard(data.username, data.damage);
  } else if (data.type === "defeatBoss") {
    handleBossDefeat(data.bossName);
  } else if (data.type === "newBoss") {
    setBossName(data.bossName);
  } else if (data.type === "member") {
    viewers.add(getDisplayName(data));
    console.log(
      `${getDisplayName(data)} joins the stream! Total viewers: ${viewers.size}`
    );
    addChatMessage(getDisplayName(data), "joined the stream!");
  } else if (
    ["gift", "like", "share", "follow", "subscribe"].includes(data.type)
  ) {
    handleEvent(getDisplayName(data), data.type, data.amount || 1);
  }
};

// --- Initialize UI on load ---
window.onload = function () {
  updateHP();
  updateShield();
  setBossName(boss.name);
  updateBossSprite();
  updateLeaderboard();
};
