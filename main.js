<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Kazestream TikTok Boss Overlay</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style.css" />
    <link rel="icon" href="data:," />
    <script defer src="main.js"></script>
</head>
<body>
    <div id="hpBar"></div>
    <div id="shieldBar"></div>

    <div id="streamBoss">
        <img id="bossSprite" src="assets/images/Boss1.png" alt="Boss">
        <div id="bossName">Boss: ???</div>
    </div>

    <div id="topAttacker"></div>
    <div id="leaderboard"></div>

    <audio id="hitSound" src="assets/audio/hit.mp3"></audio>
    <audio id="killSound" src="assets/audio/kill.mp3"></audio>
    <audio id="shieldDepletedSound" src="assets/audio/shield-depleted.mp3"></audio>
    <audio id="shieldOnSound" src="assets/audio/shield-on.mp3"></audio>
</body>
</html>

<style>
body {
    background: transparent;
    color: #fff;
    font-family: "Segoe UI", Arial, sans-serif;
    margin: 0;
    padding: 0;
    overflow: hidden;
}

#hpBar, #shieldBar {
    width: 400px;
    height: 32px;
    margin: 20px auto 10px;
    border-radius: 8px;
    line-height: 32px;
    font-weight: bold;
    text-align: center;
    font-size: 1.2em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    transition: width 0.3s ease, background 0.3s ease;
}

#streamBoss {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
}

#bossSprite {
    width: 256px;
    height: 256px;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    background: #222;
}

#bossName {
    font-size: 2em;
    font-weight: bold;
    text-align: center;
    text-shadow: 2px 2px 8px #000;
    margin-top: 12px;
}
</style>

<script>
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
    if (user) leaderboard
