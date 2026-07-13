// --- 1. Game State ---
const state = {
    vampPos: 1,
    rabbitPos: 1,
    isVampTurn: true,
    // Add your tasks here: { SquareNumber: "Task Description" }
    tasks: {
        5: "Give your partner a sweet kiss.",
        10: "Hold hands for 30 seconds.",
        15: "Share a secret with each other.",
        20: "Give a compliment about their smile."
    }
};

// --- 2. Initialize Board ---
const boardTrack = document.getElementById('board-track');
const vampToken = document.getElementById('token-vamp');
const rabbitToken = document.getElementById('token-rabbit');

function initBoard() {
    for (let i = 1; i <= 200; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        square.id = `sq-${i}`;
        square.innerText = i;
        boardTrack.appendChild(square);
    }
    // Set initial positions
    updateTokenPosition('vamp', state.vampPos);
    updateTokenPosition('rabbit', state.rabbitPos);
}

// --- 3. Token Movement & Auto-Scroll ---
function updateTokenPosition(player, position) {
    const targetSquare = document.getElementById(`sq-${position}`);
    const token = player === 'vamp' ? vampToken : rabbitToken;
    
    // Move token to the square
    targetSquare.appendChild(token);
    
    // Auto-Scroll: Keeps the active token in the center of the viewport
    targetSquare.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- 4. Core Game Logic ---
function rollDice() {
    const roll = Math.floor(Math.random() * 6) + 1;
    const turnDisplay = document.getElementById('turn-display');
    
    if (state.isVampTurn) {
        state.vampPos = Math.min(state.vampPos + roll, 200);
        updateTokenPosition('vamp', state.vampPos);
        checkTask(state.vampPos, 'VAMP');
        turnDisplay.innerText = "RABBIT'S TURN 🐰";
    } else {
        state.rabbitPos = Math.min(state.rabbitPos + roll, 200);
        updateTokenPosition('rabbit', state.rabbitPos);
        checkTask(state.rabbitPos, 'RABBIT');
        turnDisplay.innerText = "VAMP'S TURN 👅";
    }
    
    state.isVampTurn = !state.isVampTurn;
}

// --- 5. Task System ---
function checkTask(position, player) {
    if (state.tasks[position]) {
        const modal = document.getElementById('task-modal');
        document.getElementById('task-title').innerText = `${player}'s Task!`;
        document.getElementById('task-desc').innerText = state.tasks[position];
        modal.classList.remove('hidden'); // Show modal
    }
}

function acceptTask() {
    document.getElementById('task-modal').classList.add('hidden');
}

function skipTask() {
    // Basic skip logic
    alert("Task skipped!");
    document.getElementById('task-modal').classList.add('hidden');
}

// --- 6. Initialization ---
window.onload = initBoard;
document.getElementById('roll-btn').addEventListener('click', rollDice);
