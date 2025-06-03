console.log("TikTok Live Connector is running!");

// Prevent duplicate WebSocket declarations
if (!window.socket) {
    window.socket = new WebSocket("ws://localhost:21213");

    window.socket.onopen = () => console.log("WebSocket connected!");
    window.socket.onmessage = (event) => console.log("Received data:", event.data);
    window.socket.onerror = (error) => console.log("WebSocket error:", error);
    window.socket.onclose = () => console.log("WebSocket disconnected.");
}

const socket = window.socket;

const boss = { name: "???", hp: 2000, maxHp: 2000, shield: 0, spriteIndex: 1 };
const leaderboard = {};
const bossSprites = 14;
const viewers = new Set();
let shieldCooldown = false;

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
    document.getElementById("bossName").textContent = name ? `Boss: ${name}` : "Boss: ???";
}

function updateBossSprite() {
    const img = document.getElementById("bossSprite");
    img.src = `assets/images/Boss${boss.spriteIndex}.png`;
}

function bossHitEffect() {
    const img = document.getElementById("bossSprite");
    if (img) {
        img.style.filter = "brightness(2) drop-shadow(0 0 10px red)";
        setTimeout(() => img.style.filter = "", 200);
    }
}

function updateLeaderboard(user, damage) {
    if (user) leaderboard[user] = (leaderboard[user] || 0) + damage;
    const sortedUsers = Object.keys(leaderboard).sort((a, b) => leaderboard[b] - leaderboard[a]);
    const topUsers = sortedUsers.slice(0, 10);

    const leaderboardDiv = document.getElementById("leaderboard");
    leaderboardDiv.innerHTML = "<h2>Leaderboard</h2>";
    topUsers.forEach((user, index) => {
        const userDiv = document.createElement("div");
        userDiv.textContent = `${index + 1}. ${user}: ${leaderboard[user]}`;
        leaderboardDiv.appendChild(userDiv);
    });
}

function handleBossDamage(damage) {
    const actualDamage = Math.max(0, damage - boss.shield);
    boss.hp -= actualDamage;
    if (boss.shield > 0) {
        boss.shield = Math.max(0, boss.shield - damage);
        if (boss.shield === 0) {
            const shieldDepleted = document.getElementById("shieldDepletedSound");
            if (shieldDepleted) shieldDepleted.play();
        }
    }
    const hitSound = document.getElementById("hitSound");
    if (hitSound) hitSound.play();
    updateHP();
    updateShield();
    bossHitEffect();

    if (boss.hp <= 0) {
        const killSound = document.getElementById("killSound");
        if (killSound) killSound.play();
        setTimeout(() => {
            boss.hp = boss.maxHp;
            boss.shield = 0;
            updateHP();
            updateShield();
        }, 3000);
    }
}

function sendTestGift() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            user: "test_user",
            type: "gift",
            amount: 99
        }));
    } else {
        console.log("WebSocket is not open, cannot send message.");
    }
}

socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
});

socket.addEventListener("message", (event) => {
    let data;
    try {
        data = JSON.parse(event.data);
    } catch (e) {
        console.log("Invalid JSON received:", event.data);
        return;
    }
    switch (data.type) {
        case "BOSS_NAME":
            setBossName(data.name);
            break;
        case "BOSS_DAMAGE":
            handleBossDamage(data.damage);
            updateLeaderboard(data.user, data.damage);
            break;
        case "BOSS_HEAL":
            boss.hp = Math.min(boss.maxHp, boss.hp + data.heal);
            updateHP();
            break;
        case "BOSS_SHIELD":
            boss.shield = Math.min(boss.maxHp, boss.shield + data.shield);
            updateShield();
            break;
        case "TOP_ATTACKER":
            const topAttacker = document.getElementById("topAttacker");
            if (topAttacker) {
                topAttacker.textContent = `Top Attacker: ${data.user} (${data.damage})`;
                setTimeout(() => topAttacker.textContent = "", 5000);
            }
            break;
        case "VIEWER_JOIN":
            viewers.add(data.user);
            break;
        case "VIEWER_LEAVE":
            viewers.delete(data.user);
            break;
        default:
            console.log("Unknown message type:", data.type);
    }
});

// Initialize UI on load
updateHP();
updateShield();
updateBossSprite();
setBossName(boss.name);

// Example usage: call sendTestGift() from the console or after the socket opens
// socket.onopen = () => {
//     console.log("WebSocket connected!");
//     sendTestGift();
// };