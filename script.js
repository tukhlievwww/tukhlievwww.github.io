const video = document.getElementById("video");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let board = Array(9).fill(null);
let hoverCell = null;
let locked = false;

// ================= CAMERA =================
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => video.srcObject = stream);

// ================= DRAW =================
function drawBoard() {
  ctx.clearRect(0, 0, 300, 300);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";

  ctx.beginPath();
  ctx.moveTo(100, 0); ctx.lineTo(100, 300);
  ctx.moveTo(200, 0); ctx.lineTo(200, 300);
  ctx.moveTo(0, 100); ctx.lineTo(300, 100);
  ctx.moveTo(0, 200); ctx.lineTo(300, 200);
  ctx.stroke();
}

function drawO(cell) {
  const x = (cell % 3) * 100 + 50;
  const y = Math.floor(cell / 3) * 100 + 50;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.strokeStyle = "green";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawX(cell) {
  const x = (cell % 3) * 100;
  const y = Math.floor(cell / 3) * 100;
  ctx.strokeStyle = "red";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(x + 20, y + 20);
  ctx.lineTo(x + 80, y + 80);
  ctx.moveTo(x + 80, y + 20);
  ctx.lineTo(x + 20, y + 80);
  ctx.stroke();
}

function drawHover(cell) {
  if (cell === null) return;
  const x = (cell % 3) * 100;
  const y = Math.floor(cell / 3) * 100;
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 5, y + 5, 90, 90);
}

// ================= AI (MINIMAX) =================
function checkWinner(b) {
  const w = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b2,c] of w) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
  }
  return null;
}

function minimax(b, isAI) {
  const winner = checkWinner(b);
  if (winner === "X") return 1;
  if (winner === "O") return -1;
  if (!b.includes(null)) return 0;

  let scores = [];
  for (let i = 0; i < 9; i++) {
    if (b[i] === null) {
      b[i] = isAI ? "X" : "O";
      scores.push(minimax(b, !isAI));
      b[i] = null;
    }
  }
  return isAI ? Math.max(...scores) : Math.min(...scores);
}

function bestMove() {
  let bestScore = -999;
  let move = null;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = "X";
      let score = minimax(board, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

// ================= GESTURES =================
function fingerOpen(tip, pip) {
  return tip.y < pip.y;
}

function isFist(hand) {
  const fingers = [[8,6],[12,10],[16,14],[20,18]];
  return fingers.every(f => !fingerOpen(hand[f[0]], hand[f[1]]));
}

// ================= GAME LOOP =================
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});

hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.7
});

hands.onResults(results => {
  drawBoard();

  board.forEach((v,i) => {
    if (v === "O") drawO(i);
    if (v === "X") drawX(i);
  });

  if (!results.multiHandLandmarks) return;

  const hand = results.multiHandLandmarks[0];
  const index = hand[8];

  const x = index.x * 300;
  const y = index.y * 300;

  const col = Math.floor(x / 100);
  const row = Math.floor(y / 100);

  hoverCell = (col>=0 && col<3 && row>=0 && row<3)
    ? row*3 + col
    : null;

  drawHover(hoverCell);

  if (isFist(hand) && hoverCell !== null && !locked && board[hoverCell] === null) {
    locked = true;

    // Player (O)
    board[hoverCell] = "O";
    drawO(hoverCell);

    // AI (X)
    setTimeout(() => {
      const ai = bestMove();
      if (ai !== null) {
        board[ai] = "X";
        drawX(ai);
      }
      locked = false;
    }, 400);
  }
});

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  }
});
camera.start();
