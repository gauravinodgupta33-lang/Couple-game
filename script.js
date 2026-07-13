
// Function to generate the board
function createBoard() {
    const boardTrack = document.getElementById('board-track');
    
    // Loop 200 times to create 200 squares
    for (let i = 1; i <= 200; i++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.innerText = i;
        square.id = 'square-' + i;
        
        // Add click event for when you're ready for tasks
        square.onclick = () => console.log("Clicked square " + i);
        
        boardTrack.appendChild(square);
    }
}

// Run the function when the page loads
window.onload = createBoard;
