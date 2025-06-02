console.log("TikTok Live Connector is running!");

const boss = { name: "???", hp: 2000, maxHp: 2000, shield: 0, spriteIndex: 1 };
const leaderboard = {};
const bossSprites = 14;
const viewers = new Set();
let shieldCooldown = false;

const socket = new WebSocket("ws://localhost:21213/");

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
            document.getElementById("shieldDepletedSound").play();
        }
    }
    document.getElementById("hitSound").play();
    updateHP();
    updateShield();
    bossHitEffect();

    if (boss.hp <= 0) {
        document.getElementById("killSound").play();
        setTimeout(() => {
            boss.hp = boss.maxHp;
            boss.shield = 0;
            updateHP();
            updateShield();
        }, 3000);
    }
}

socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
});

socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
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
            topAttacker.textContent = `Top Attacker: ${data.user} (${data.damage})`;
            setTimeout(() => topAttacker.textContent = "", 5000);
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

updateHP();
updateShield();
updateBossSprite();
setBossName(boss.name);