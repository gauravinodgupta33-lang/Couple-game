/* ==========================================================
   LOVESICK — Game Logic (Original Structure + Hopping Logic)
   ========================================================== */

const BOARD_SIZE = 200;
const PAGE_SIZE = 50;      // squares shown at once
const ROW_LEN = 10;        // squares per row (matches 10-col CSS grid)

/* ----------------------------------------------------------
   Helper: Added for the hopping animation
   ---------------------------------------------------------- */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ----------------------------------------------------------
   Game State
   ---------------------------------------------------------- */
const state = {
  players: {
    vamp:   { name: 'VAMP',   img: 'assets/vamp.png',   position: 1, skips: 0, accepted: 0 },
    rabbit: { name: 'RABBIT', img: 'assets/rabbit.png', position: 1, skips: 0, accepted: 0 }
  },
  turnOrder: ['vamp', 'rabbit'],
  currentTurnIndex: 0,
  isRolling: false,
  isModalOpen: false,
  pendingSquare: null,      // square number currently showing a task
  history: []                // for UNDO — snapshots of state
};

/* ----------------------------------------------------------
   DOM References
   ---------------------------------------------------------- */
const boardEl        = document.getElementById('board');
const diceBtn         = document.getElementById('dice-btn');
const diceFace        = document.getElementById('dice-face');
const diceLabel       = document.getElementById('dice-label');
const turnText        = document.getElementById('turn-text');
const turnPill        = document.getElementById('turn-pill');
const skipBadge       = document.getElementById('skip-badge');
const btnRules        = document.getElementById('btn-rules');
const btnCloseRules   = document.getElementById('btn-close-rules');
const rulesModal      = document.getElementById('rules-modal');

const taskModal       = document.getElementById('task-modal');
const modalSquareLabel = document.getElementById('modal-square-label');
const modalTaskText   = document.getElementById('modal-task-text');
const modalHint       = document.getElementById('modal-hint');
const btnAccept       = document.getElementById('btn-accept');
const btnSkip         = document.getElementById('btn-skip');

const progressVamp    = document.getElementById('progress-vamp');
const progressRabbit  = document.getElementById('progress-rabbit');
const scoreVamp       = document.getElementById('score-vamp');
const scoreRabbit     = document.getElementById('score-rabbit');
const pageChipVamp    = document.getElementById('page-chip-vamp');
const pageChipRabbit  = document.getElementById('page-chip-rabbit');

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/* ----------------------------------------------------------
   Task Hook
   ---------------------------------------------------------- */
/* ----------------------------------------------------------
   Task Hook (Example: 10 Tasks)
   ---------------------------------------------------------- */
function getTaskForSquare(squareNumber) {
    return "abhishek ki bandi bghhhhchhag gyi";
}


/* ----------------------------------------------------------
   Snake-order board math
   ---------------------------------------------------------- */
function rowOf(n) {
  return Math.floor((n - 1) / ROW_LEN);
}

function isReversedRow(rowIndex) {
  return rowIndex % 2 === 1;
}

function buildPageSquares(pageStart) {
  const squares = [];
  const rowsInPage = PAGE_SIZE / ROW_LEN;
  const baseRow = Math.floor((pageStart - 1) / ROW_LEN);

  for (let r = 0; r < rowsInPage; r++) {
    const globalRow = baseRow + r;
    const rowStartNum = globalRow * ROW_LEN + 1;
    const rowNums = [];
    for (let c = 0; c < ROW_LEN; c++) {
      rowNums.push(rowStartNum + c);
    }
    if (isReversedRow(globalRow)) rowNums.reverse();
    squares.push(...rowNums);
  }
  return squares;
}

function pageOf(squareNumber) {
  return Math.floor((squareNumber - 1) / PAGE_SIZE);
}
/* ----------------------------------------------------------
   Rendering
   ---------------------------------------------------------- */
let currentPage = 0;

function render() {
  renderBoard();
  renderPlayerBar();
  renderTurnPill();
}

function renderBoard(animateSwap = false) {
  const doRender = () => {
    const pageStart = currentPage * PAGE_SIZE + 1;
    const squareNums = buildPageSquares(pageStart);

    boardEl.innerHTML = '';
    squareNums.forEach(num => {
      const sq = document.createElement('div');
      sq.className = 'square';
      sq.dataset.square = num;

      if (num === BOARD_SIZE) sq.classList.add('square-final');

      // occupants on this square
      const occupants = state.turnOrder.filter(id => state.players[id].position === num);
      if (occupants.length) sq.classList.add('square-current');

      if (num === BOARD_SIZE) {
        const crown = document.createElement('span');
        crown.className = 'square-crown';
        crown.textContent = '👑';
        sq.appendChild(crown);
      }

      const numEl = document.createElement('span');
      numEl.className = 'square-number';
      numEl.textContent = num;
      sq.appendChild(numEl);

      if (occupants.length) {
        const tokenWrap = document.createElement('div');
        tokenWrap.className = 'square-tokens';
                occupants.forEach(id => {
          const t = document.createElement('div');
          t.className = 'token' + (id === 'rabbit' ? ' token-rabbit' : '');

          // --- YEH NAYA CODE ADD KARNA HAI ---
          const movingId = state.turnOrder[state.currentTurnIndex];
          if (state.isRolling && id === movingId) {
            t.classList.add('animate-hop');
          }
          // -----------------------------------

          const img = document.createElement('img');
          img.src = state.players[id].img;
          img.alt = state.players[id].name;
          t.appendChild(img);
          tokenWrap.appendChild(t);
        });
         
        sq.appendChild(tokenWrap);
      }

      boardEl.appendChild(sq);
    });
  };

  if (animateSwap) {
    boardEl.classList.add('board-swap');
    setTimeout(() => {
      doRender();
      boardEl.classList.remove('board-swap');
    }, 200);
  } else {
    doRender();
  }
}

function renderPlayerBar() {
  const vamp = state.players.vamp;
  const rabbit = state.players.rabbit;

  progressVamp.style.width = `${(vamp.position / BOARD_SIZE) * 100}%`;
  progressRabbit.style.width = `${(rabbit.position / BOARD_SIZE) * 100}%`;

  scoreVamp.textContent = `${vamp.position} / ${BOARD_SIZE}`;
  scoreRabbit.textContent = `${rabbit.position} / ${BOARD_SIZE}`;

  updatePageChip(pageChipVamp, vamp.position);
  updatePageChip(pageChipRabbit, rabbit.position);
}

// Shows a small tappable chip when a player's token is on a
// different 50-square page than the one currently visible.
function updatePageChip(chipEl, position) {
  if (!chipEl) return; 
  const playerPage = pageOf(position);
  if (playerPage === currentPage) {
    chipEl.hidden = true;
    return;
  }
  const rangeStart = playerPage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(rangeStart + PAGE_SIZE - 1, BOARD_SIZE);
  chipEl.hidden = false;
  chipEl.textContent = `on ${rangeStart}-${rangeEnd} →`;
  chipEl.onclick = () => {
    currentPage = playerPage;
    renderBoard(true);
    renderPlayerBar();
  };
}

function renderTurnPill() {
  const currentId = state.turnOrder[state.currentTurnIndex];
  const player = state.players[currentId];

  turnText.textContent = `${player.name}'S TURN`;

  if (player.skips > 0) {
    skipBadge.hidden = false;
    skipBadge.textContent = `${player.skips} skip${player.skips > 1 ? 's' : ''}`;
  } else {
    skipBadge.hidden = true;
  }
}

/* ----------------------------------------------------------
   Page auto-scroll
   ---------------------------------------------------------- */
function ensurePageVisible(squareNumber, animate = true) {
  const targetPage = pageOf(squareNumber);
  if (targetPage !== currentPage) {
    currentPage = targetPage;
    renderBoard(animate);
  } else {
    renderBoard(false);
  }
  renderPlayerBar();
}

/* ----------------------------------------------------------
   History (Undo) — snapshot before every roll/move
   ---------------------------------------------------------- */
function snapshotState() {
  state.history.push(JSON.parse(JSON.stringify({
    players: state.players,
    currentTurnIndex: state.currentTurnIndex,
    currentPage
  })));
  // cap history so it doesn't grow unbounded
  if (state.history.length > 30) state.history.shift();
}

function undo() {
  if (state.isRolling || state.isModalOpen) return;
  const prev = state.history.pop();
  if (!prev) return;

  state.players = prev.players;
  state.currentTurnIndex = prev.currentTurnIndex;
  currentPage = prev.currentPage;

  render();
}

/* ----------------------------------------------------------
   Dice Roll
   ---------------------------------------------------------- */
function rollDice() {
  if (state.isRolling || state.isModalOpen) return;

  state.isRolling = true;
  diceBtn.disabled = true;
  diceFace.classList.add('rolling');
  diceLabel.textContent = 'ROLLING…';

  let spins = 0;
  const spinInterval = setInterval(() => {
    diceFace.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    spins++;
    if (spins > 8) {
      clearInterval(spinInterval);
      finishRoll();
    }
  }, 60);
}

function finishRoll() {
  const result = Math.floor(Math.random() * 6) + 1;
  diceFace.textContent = DICE_FACES[result - 1];
  diceFace.classList.remove('rolling');
  diceLabel.textContent = 'TAP TO ROLL';

  snapshotState();
  // Initiate the async hop movement
  moveCurrentPlayer(result);
}

/* ----------------------------------------------------------
   Movement with "Hopping" Animation
   ---------------------------------------------------------- */
async function moveCurrentPlayer(steps) {
  const currentId = state.turnOrder[state.currentTurnIndex];
  const player = state.players[currentId];

  // Loop through steps to create the hopping effect
  for (let i = 0; i < steps; i++) {
    if (player.position >= BOARD_SIZE) break;

    player.position += 1;

    // Refresh view for each hop
    ensurePageVisible(player.position, false);
    
    // Pause for the hop animation
    await sleep(250); 
  }

  state.isRolling = false;
  diceBtn.disabled = false;

  if (player.position >= BOARD_SIZE) {
    player.position = BOARD_SIZE;
    render(); // Final render
    setTimeout(() => showWin(currentId), 400);
    return;
  }

  // open the task popup ONLY after hops complete
  setTimeout(() => openTaskModal(currentId, player.position), 350);
}
/* ----------------------------------------------------------
   Task Modal (Accept / Skip)
   ---------------------------------------------------------- */
function openTaskModal(playerId, squareNumber) {
  state.isModalOpen = true;
  state.pendingSquare = { playerId, squareNumber };

  modalSquareLabel.textContent = `Square ${squareNumber}`;
  modalTaskText.textContent = getTaskForSquare(squareNumber);

  const player = state.players[playerId];
  const remaining = 3 - (player.accepted % 3);
  modalHint.textContent = player.skips > 0
    ? `You have ${player.skips} skip${player.skips > 1 ? 's' : ''} banked · ${remaining} more accepted task${remaining > 1 ? 's' : ''} for another`
    : `Complete 3 accepted tasks to earn 1 skip · ${remaining} to go`;

  taskModal.hidden = false;
}

function closeTaskModal() {
  taskModal.hidden = true;
  state.isModalOpen = false;
  state.pendingSquare = null;
}

function handleAccept() {
  if (!state.pendingSquare) return;
  const { playerId } = state.pendingSquare;
  const player = state.players[playerId];

  player.accepted += 1;
  if (player.accepted % 3 === 0) {
    player.skips += 1;
  }

  closeTaskModal();
  renderTurnPill();
  endTurn();
}

function handleSkip() {
  if (!state.pendingSquare) return;
  
  // Logic: Consume a skip if available
  const { playerId } = state.pendingSquare;
  const player = state.players[playerId];
  
  if (player.skips > 0) {
    player.skips -= 1;
  }
  
  closeTaskModal();
  renderTurnPill();
  // Turn does NOT change — same player keeps their turn
}

/* ----------------------------------------------------------
   Turn management
   ---------------------------------------------------------- */
function endTurn() {
  state.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
  renderTurnPill();
}

/* ----------------------------------------------------------
   Win state
   ---------------------------------------------------------- */
function showWin(playerId) {
  const player = state.players[playerId];

  const banner = document.createElement('div');
  banner.className = 'win-banner';
  banner.id = 'win-banner';
  banner.innerHTML = `
    <div class="win-banner-avatar"><img src="${player.img}" alt="${player.name}"></div>
    <h2>${player.name} WINS!</h2>
    <p>Reached square 200 first 👑</p>
    <button class="modal-btn modal-btn-accept" id="btn-play-again" style="max-width:200px;padding:14px 28px;">PLAY AGAIN</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('btn-play-again').addEventListener('click', () => {
    banner.remove();
    resetGame();
  });
}

function resetGame() {
  state.players.vamp = { name: 'VAMP', img: 'assets/vamp.png', position: 1, skips: 0, accepted: 0 };
  state.players.rabbit = { name: 'RABBIT', img: 'assets/rabbit.png', position: 1, skips: 0, accepted: 0 };
  state.currentTurnIndex = 0;
  state.history = [];
  currentPage = 0;
  render();
}


/* ----------------------------------------------------------
   Rules Modal
   ---------------------------------------------------------- */
function openRules() {
  rulesModal.hidden = false;
}
function closeRules() {
  rulesModal.hidden = true;
}

/* ----------------------------------------------------------
   Event Listeners
   ---------------------------------------------------------- */
diceBtn.addEventListener('click', rollDice);
btnRules.addEventListener('click', openRules);
btnCloseRules.addEventListener('click', closeRules);
btnAccept.addEventListener('click', handleAccept);
btnSkip.addEventListener('click', handleSkip);

// Close modals by tapping the dark overlay outside the card
taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) { 
    // Require explicit choice — no-op
  }
});

rulesModal.addEventListener('click', (e) => {
  if (e.target === rulesModal) closeRules();
});

/* ----------------------------------------------------------
   Init
   ---------------------------------------------------------- */
render();
