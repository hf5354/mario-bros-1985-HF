// game.js - 孖寶兄弟 1985 風格 Online 一關單人版
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;


const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 460;
const TILE_SIZE = 32;
const LEVEL_END = 3000;


// 玩家
let player = {
    x: 100, y: GROUND_Y - 48, vx: 0, vy: 0,
    width: 32, height: 48,
    facing: 1, onGround: false,
    lives: 3, score: 0,
    reset: function() { this.x = 100; this.y = GROUND_Y - 48; this.vx = 0; this.vy = 0; }
};


// 攝影機
let camera = { x: 0 };


// 遊戲狀態
let gameOver = false;
let won = false;
let keys = {};


// 平台
const platforms = [
    {x: 0, y: GROUND_Y, w: LEVEL_END, h: 32},  // 地面
    {x: 400, y: GROUND_Y - 100, w: 160, h: 32},
    {x: 800, y: GROUND_Y - 180, w: 128, h: 32},
    {x: 1200, y: GROUND_Y - 140, w: 192, h: 32},
    {x: 1700, y: GROUND_Y - 220, w: 96, h: 32},
    {x: 2200, y: GROUND_Y - 100, w: 160, h: 32},
    {x: 2600, y: GROUND_Y - 180, w: 128, h: 32}
];


// 金幣
let coins = [
    {x: 450, y: GROUND_Y - 140, w: 24, h: 24, collected: false, angle: 0},
    {x: 850, y: GROUND_Y - 220, w: 24, h: 24, collected: false, angle: 0},
    {x: 1250, y: GROUND_Y - 180, w: 24, h: 24, collected: false, angle: 0},
    {x: 1750, y: GROUND_Y - 260, w: 24, h: 24, collected: false, angle: 0},
    {x: 2250, y: GROUND_Y - 140, w: 24, h: 24, collected: false, angle: 0},
    {x: 2650, y: GROUND_Y - 220, w: 24, h: 24, collected: false, angle: 0}
];


// 怪物
let enemies = [
    {x: 600, y: GROUND_Y - 40, vx: -2, width: 32, height: 40, timer: 0},
    {x: 1100, y: GROUND_Y - 40, vx: 2, width: 32, height: 40, timer: 100},
    {x: 1600, y: GROUND_Y - 40, vx: -2, width: 32, height: 40, timer: 200},
    {x: 2100, y: GROUND_Y - 40, vx: 2, width: 32, height: 40, timer: 0},
    {x: 2500, y: GROUND_Y - 40, vx: -2, width: 32, height: 40, timer: 150}
];


// 終點旗
const goal = {x: LEVEL_END - 80, y: GROUND_Y - 200, w: 32, h: 200};


// 輸入
window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === ' ') e.preventDefault();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);


// 碰撞偵測
function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.width > b.x &&
           a.y < b.y + b.h && a.y + a.height > b.y;
}


// 更新玩家
function updatePlayer(dt) {
    // 輸入
    player.vx = 0;
    if (keys['arrowleft']) { player.vx = -4; player.facing = -1; }
    if (keys['arrowright']) { player.vx = 4; player.facing = 1; }
    if (keys['arrowup'] && player.onGround) player.vy = -14;


    // 物理
    player.vy += 0.8;  // 重力
    player.x += player.vx;
    player.y += player.vy;


    player.onGround = false;


    // 平台碰撞
    for (let plat of platforms) {
        if (rectCollide(player, plat)) {
            if (player.vy > 0 && player.y < plat.y) {  // 從上落地
                player.y = plat.y - player.height;
                player.vy = 0;
                player.onGround = true;
            } else if (player.vx > 0 && player.x < plat.x) {
                player.x = plat.x - player.width;
            } else if (player.vx < 0 && player.x + player.width > plat.x + plat.w) {
                player.x = plat.x + plat.w;
            }
        }
    }


    // 邊界
    if (player.x < 0) player.x = 0;
    if (player.y > GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.vy = 0;
        player.onGround = true;
    }
}


// 更新怪物
function updateEnemies() {
    for (let enemy of enemies) {
        enemy.x += enemy.vx;
        enemy.timer++;
        if (enemy.timer % 180 === 0) enemy.vx *= -1;  // 轉向


        // 邊界反彈
        for (let plat of platforms) {
            if (rectCollide(enemy, plat)) {
                if (enemy.vx > 0) enemy.x = plat.x - enemy.width;
                else enemy.x = plat.x + plat.w;
                enemy.vx *= -1;
            }
        }
    }
}


// 更新金幣
function updateCoins() {
    for (let coin of coins) {
        if (!coin.collected && rectCollide(player, coin)) {
            coin.collected = true;
            player.score += 100;
        }
        if (!coin.collected) coin.angle += 0.2;
    }
}


// 檢查怪物碰撞
function checkEnemies() {
    for (let enemy of enemies) {
        if (rectCollide(player, enemy)) {
            // 踩死怪物？
            if (player.vy > 0 && player.y < enemy.y - 10) {
                // 殺怪
                enemy.x = -100;  // 移走
                player.vy = -8;  // 彈起
                player.score += 200;
            } else {
                // 玩家死
                player.lives--;
                if (player.lives > 0) {
                    player.reset();
                    camera.x = 0;
                } else {
                    gameOver = true;
                }
            }
        }
    }
}


// 檢查勝利
function checkWin() {
    if (rectCollide(player, goal)) {
        won = true;
        gameOver = true;
    }
}


// 更新攝影機
function updateCamera() {
    camera.x = player.x - WIDTH / 2 + player.width / 2;
    camera.x = Math.max(0, Math.min(camera.x, LEVEL_END - WIDTH));
}


// 畫背景
function drawBackground() {
    // 天空
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8E9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);


    // 雲朵 (視差)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const cloudOffset = camera.x * 0.3;
    ctx.fillRect(100 - cloudOffset % 2000, 80, 120, 40);
    ctx.fillRect(600 - cloudOffset % 2000, 120, 100, 30);
    ctx.fillRect(1100 - cloudOffset % 2000, 60, 140, 50);


    // 太陽
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(200 - camera.x * 0.1, 100, 40, 0, Math.PI * 2);
    ctx.fill();
}


// 畫平台
function drawPlatforms() {
    ctx.fillStyle = '#8B4513';
    for (let plat of platforms) {
        const px = plat.x - camera.x;
        if (px + plat.w > 0 && px < WIDTH) {
            ctx.fillRect(px, plat.y, plat.w, plat.h);
            ctx.fillStyle = '#654321';
            ctx.fillRect(px, plat.y, plat.w, 4);  // 上緣
            ctx.fillStyle = '#8B4513';
        }
    }
}


// 畫玩家
function drawPlayer() {
    const px = player.x - camera.x;
    const py = player.y;


    ctx.save();
    ctx.translate(px + player.width / 2, py + player.height / 2);
    ctx.scale(player.facing, 1);
    ctx.translate(-player.width / 2, -player.height / 2);


    // 鞋子
    ctx.fillStyle = '#000';
    ctx.fillRect(4, 36, 8, 8);
    ctx.fillRect(20, 36, 8, 8);


    // 褲子
    ctx.fillStyle = '#0066CC';
    ctx.fillRect(8, 24, 16, 16);


    // 上衣
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(4, 16, 24, 12);


    // 頭
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(10, 4, 12, 12);


    // 帽子
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(8, 0, 16, 8);
    ctx.fillRect(12, -4, 8, 8);  // 帽頂


    // 鬍子/眼睛
    ctx.fillStyle = '#000';
    ctx.fillRect(14, 8, 2, 2);  // 眼睛
    ctx.fillRect(18, 10, 4, 2); // 鬍


    ctx.restore();
}


// 畫怪物
function drawEnemies() {
    for (let enemy of enemies) {
        const ex = enemy.x - camera.x;
        if (ex > -50 && ex < WIDTH + 50) {
            ctx.fillStyle = '#008000';
            ctx.fillRect(ex, enemy.y, enemy.width, enemy.height);
            ctx.fillStyle = '#006600';
            ctx.fillRect(ex + 4, enemy.y + 4, enemy.width - 8, 8);  // 眼睛
            ctx.fillStyle = '#008000';
        }
    }
}


// 畫金幣
function drawCoins() {
    for (let coin of coins) {
        if (!coin.collected) {
            const cx = coin.x - camera.x;
            const cy = coin.y;
            ctx.save();
            ctx.translate(cx + coin.w / 2, cy + coin.h / 2);
            ctx.rotate(coin.angle);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-coin.w / 2, -coin.h / 2, coin.w, coin.h);
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(-coin.w / 2 + 4, -coin.h / 2 + 4, coin.w - 8, coin.h - 8);
            ctx.restore();
        }
    }
}


// 畫旗
function drawGoal() {
    const gx = goal.x - camera.x;
    ctx.fillStyle = '#654321';
    ctx.fillRect(gx, goal.y, goal.w, goal.h);
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(gx + 8, goal.y + 8, 16, 32);  // 旗布
}


// 畫 HUD
function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, WIDTH, 40);


    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${player.score.toString().padStart(6, '0')}`, 20, 28);
    ctx.fillText(`LIVES: ${player.lives}`, 500, 28);


    ctx.textAlign = 'center';
}


// 主迴圈
function loop() {
    // 更新
    if (!gameOver) {
        updatePlayer();
        updateEnemies();
        updateCoins();
        checkEnemies();
        checkWin();
        updateCamera();
    }


    // 畫面
    drawBackground();
    drawPlatforms();
    drawGoal();
    drawCoins();
    drawEnemies();
    drawPlayer();
    drawHUD();


    // 結束畫面
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.font = '48px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillStyle = won ? '#FFD700' : '#FF0000';
        ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', WIDTH / 2, HEIGHT / 2);
        ctx.font = '24px "Press Start 2P"';
        ctx.fillStyle = '#FFF';
        ctx.fillText('按空白鍵重新開始', WIDTH / 2, HEIGHT / 2 + 80);
    }


    // 重啟
    if (gameOver && keys[' ']) {
        player = {x: 100, y: GROUND_Y - 48, vx: 0, vy: 0, width: 32, height: 48, facing: 1, onGround: false, lives: 3, score: 0, reset: function(){}};
        coins.forEach(c => c.collected = false);
        enemies.forEach(e => { e.x = [600,1100,1600,2100,2500][enemies.indexOf(e)]; e.vx = [-2,2,-2,2,-2][enemies.indexOf(e)]; e.timer = 0; });
        gameOver = false;
        won = false;
        camera.x = 0;
    }


    requestAnimationFrame(loop);
}


loop();