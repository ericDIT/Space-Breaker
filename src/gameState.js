/**
 * This is the logic for the Gamestate which controlls 'start', 'playing', 'paused', 'gameover'.
 * 
 */

export class GameStateManager {
  constructor() {
    this.state = 'start'; // 'start', 'playing', 'paused', 'gameover'
    this.points = 0;
    this.highscore = parseInt(localStorage.getItem("highscore")) || 0;
    
    this.pointsUI = document.querySelector("#pointsUI");
    this.highscoreUI = document.querySelector("#highscoreUI");
    this.startUI = null;
    this.gameOverUI = null;
    this.pauseUI = null;
    
    this.onGameStart = null;
    this.onGameRestart = null;
    this.onGameOver = null;
    this.onReturnToMenu = null;
    
    this.createUI();
  }

  createUI() {
    this.startUI = document.createElement('div');
    this.startUI.id = 'startUI';
    if (this.highscoreUI) {
        this.highscoreUI.innerText = this.highscore;
    }
    this.startUI.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;
    this.startUI.innerHTML = `
        <h1 style="font-size: 72px; margin: 2% 0 20px 0; text-shadow: 0 0 20px #00ffff;">SPACEBREAKER</h1>
        <p style="font-size: 24px; margin: 10px 0; opacity: 0.8;">Navigate through the cosmic tunnel</p>
  
    <div style="display: flex; gap: 60px; margin: 50px 0; justify-content: center;">
        <div style="text-align: left; font-size: 18px;">
            <p style="margin-bottom: 15px;"><strong>Controls:</strong></p>
          <p style="margin: 5px 0;">WASD / Arrow Keys - Move</p>
          <p style="margin: 5px 0;">SPACE - Shoot Laser</p>
          <p style="margin: 5px 0;">ESC - Pause</p>
        </div>
    
        <div style="text-align: left; font-size: 18px;">
            <p style="margin-bottom: 15px;"><strong>Scoring:</strong></p>
            <p style="margin: 5px 0;">Stars: +10 points</p>
            <p style="margin: 5px 0;">Asteroids: +1 point</p>
            <p style="margin: 5px 0;">Collision: Game Over</p>
        </div>
    </div>
  
    <button id="startBtn" style="
      margin-top: 30px;
      padding: 20px 60px;
      font-size: 28px;
      cursor: pointer;
      background: linear-gradient(45deg, #00ffff, #0080ff);
      color: white;
      border: none;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
      transition: transform 0.2s;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      START GAME
    </button>
    
    <p style="font-size: 16px; margin-top: 20px; opacity: 0.6;">Highscore: <span id="startHighscore">${this.highscore}</span></p>
    `;
    document.body.appendChild(this.startUI);

    /**
     * Game Over Screen
    **/
    this.gameOverUI = document.createElement('div');
    this.gameOverUI.id = 'gameOverUI';
    this.gameOverUI.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      padding: 50px;
      border-radius: 20px;
      text-align: center;
      display: none;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 1000;
      border: 2px solid #ff0000;
    `;
    this.gameOverUI.innerHTML = `
      <h1 style="font-size: 64px; margin: 0 0 20px 0; color: #ff0000;">GAME OVER</h1>
      <p style="font-size: 28px; margin: 20px 0;">Score: <span id="finalScore">0</span></p>
      <p style="font-size: 24px; margin: 10px 0; color: #FFD700;">Highscore: <span id="finalHighscore">0</span></p>
      <button id="restartBtn" style="
        margin-top: 30px;
        padding: 15px 40px;
        font-size: 24px;
        cursor: pointer;
        background: linear-gradient(45deg, #4CAF50, #45a049);
        color: white;
        border: none;
        border-radius: 10px;
      ">PLAY AGAIN</button>
      <button id="mainMenuBtn" style="
        margin-top: 15px;
        margin-left: 15px;
        padding: 15px 40px;
        font-size: 24px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 2px solid white;
        border-radius: 10px;
      ">MAIN MENU</button>
    `;
    document.body.appendChild(this.gameOverUI);

    /**
     * Pause Screen
     */ 
    this.pauseUI = document.createElement('div');
    this.pauseUI.id = 'pauseUI';
    this.pauseUI.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      padding: 50px;
      border-radius: 20px;
      text-align: center;
      display: none;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;
    this.pauseUI.innerHTML = `
      <h1 style="font-size: 64px; margin: 0; color: #FFD700;">PAUSED</h1>
      <p style="font-size: 24px; margin-top: 30px;">Press ESC to continue</p>
      <p style="font-size: 18px; margin-top: 20px; opacity: 0.7;">Current Score: <span id="pauseScore">0</span></p>
    `;
    document.body.appendChild(this.pauseUI);

    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    document.getElementById('mainMenuBtn').addEventListener('click', () => this.returnToMenu());
  }

  startGame() {
    this.state = 'playing';
    this.startUI.style.display = 'none';
    if (this.pointsUI) this.pointsUI.style.display = 'block';
    
    if (this.onGameStart) this.onGameStart();
    console.log("Game started!");
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    
    this.state = 'paused';
    this.pauseUI.style.display = 'block';
    document.getElementById('pauseScore').innerText = this.points;
    console.log("Game paused");
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    
    this.state = 'playing';
    this.pauseUI.style.display = 'none';
    console.log("Game resumed");
  }

  togglePause() {
    if (this.state === 'playing') {
      this.pauseGame();
    } else if (this.state === 'paused') {
      this.resumeGame();
    }
  }

  triggerGameOver() {
    this.state = 'gameover';
    
    document.getElementById('finalScore').innerText = this.points;
    document.getElementById('finalHighscore').innerText = this.highscore;
    this.gameOverUI.style.display = 'block';
    
    if (this.onGameOver) this.onGameOver();
    console.log("GAME OVER! Final Score:", this.points);
  }

  restartGame() {
    this.state = 'playing';
    this.gameOverUI.style.display = 'none';
    this.points = 0;
    
    if (this.pointsUI) this.pointsUI.innerText = this.points;
    if (this.onGameRestart) this.onGameRestart();
    
    console.log("Game restarted!");
  }

  returnToMenu() {
    this.state = 'start';
    this.gameOverUI.style.display = 'none';
    this.startUI.style.display = 'flex';
    this.points = 0;
    
    document.getElementById('startHighscore').innerText = this.highscore;
    
    if (this.pointsUI) {
      this.pointsUI.innerText = this.points;
      this.pointsUI.style.display = 'none';
    }
    
    if (this.onReturnToMenu) this.onReturnToMenu();
    console.log("Returned to main menu");
  }

  addPoints(amount) {
    this.points += amount;
    if (this.pointsUI) this.pointsUI.innerText = this.points;
    this.checkHighscore();
  }

  checkHighscore() {
    if (this.points > this.highscore) {
      this.highscore = this.points;
      localStorage.setItem("highscore", this.highscore);
      if (this.highscoreUI) this.highscoreUI.innerText = this.highscore;
      console.log("New highscore!", this.highscore);
    }
  }

  isPlaying() {
    return this.state === 'playing';
  }

  getState() {
    return this.state;
  }
}