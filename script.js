let currentRiddle = "";
let correctAnswer = "";
let totalEarnings = 0;
let currentAnswerLength = 3;
let riddleCount = 0;
let timerInterval;

// Start the game
function startGame() {
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('riddle-container').style.display = 'block';
    document.getElementById('earnings').style.display = 'block';
    document.getElementById('progress-bar-container').style.display = 'block';
    getRiddle();
}

// Fetch a riddle based on answer length from the backend
async function getRiddle() {
    if (currentAnswerLength > 10) {  // End the game after 10-character riddles
        endGame();
        return;
    }

    const response = await fetch(`http://127.0.0.1:8000/riddle/${currentAnswerLength}`);
    const data = await response.json();
    currentRiddle = data.question;
    correctAnswer = data.answer;
    document.getElementById('riddle').innerText = currentRiddle;
    document.getElementById('result').innerText = "";
    document.getElementById('correct-answer').style.display = 'none';
    document.getElementById('answer-container').innerHTML = "";

    // Create input boxes for the answer
    for (let i = 0; i < currentAnswerLength; i++) {
        const inputBox = document.createElement('input');
        inputBox.type = 'text';
        inputBox.maxLength = 1;
        inputBox.className = 'answer-box';
        inputBox.id = `char-${i}`;
        inputBox.oninput = checkHintAvailability;
        inputBox.addEventListener('input', (event) => moveToNextBox(event, i));
        inputBox.addEventListener('keydown', (event) => handleBackspace(event, i));
        inputBox.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                submitAnswer();
            }
        });
        document.getElementById('answer-container').appendChild(inputBox);
    }

    startTimer();  // Start the timer when a new riddle is fetched
}

// Submit the user's answer and check if it's correct
async function submitAnswer() {
    stopTimer();  // Stop the timer when the user submits an answer
    let userAnswer = "";
    for (let i = 0; i < currentAnswerLength; i++) {
        const charBox = document.getElementById(`char-${i}`);
        userAnswer += charBox.value;
    }

    const response = await fetch('http://127.0.0.1:8000/check-answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riddle: currentRiddle, answer: userAnswer })
    });
    const data = await response.json();
    const resultText = data.correct ? "Correct!" : "Wrong answer!";
    const resultClass = data.correct ? "correct" : "incorrect";
    document.getElementById('result').innerText = resultText;
    document.getElementById('result').className = resultClass;

    // Play sound based on answer correctness
    if (data.correct) {
        document.getElementById('correct-sound').play();
        const earnings = currentAnswerLength * 10;  // $10 per character
        totalEarnings += earnings;
        animateDollarCounter(totalEarnings);
        riddleCount++;  // Increment the counter after each correct answer

        if (riddleCount >= 2) {  // After serving two riddles for the current length
            currentAnswerLength++;  // Move to the next length
            riddleCount = 0;  // Reset the counter for the new length
        }
        confetti({
            particleCount: 150,
            spread: 90,
            startVelocity: 40,
            origin: { y: 0.6 },
            colors: ['#ff0', '#ff6347', '#00ff00', '#1e90ff'],
            scalar: 1.2  // Size of the confetti particles
        });
    } else {
        document.getElementById('wrong-sound').play();
        document.getElementById('correct-answer').innerText = `Correct answer: ${correctAnswer}`;
        document.getElementById('correct-answer').style.display = 'block';
        riddleCount++;

        if (riddleCount >= 2) {
            currentAnswerLength++;
            riddleCount = 0;
        }
    }

    // Update earnings display
    document.getElementById('earnings').innerText = `Earnings: $${totalEarnings}`;

    // Automatically load the next riddle after 2 seconds
    setTimeout(nextRiddle, 2000);
}

// Move to the next riddle
function nextRiddle() {


    // Update progress bar
    const maxRiddles = 8 * 2;  // 8 lengths (3 to 10) with 2 riddles each
    const currentProgress = ((currentAnswerLength - 3) * 2 + riddleCount) / maxRiddles * 100;
    document.getElementById('progress-bar').style.width = `${currentProgress}%`;

    // Automatically load the next riddle
    getRiddle();
}


// Start the timer for each riddle
function startTimer() {
    let timeLeft = 60;  // 60 seconds countdown
    document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);  // Stop the timer
            document.getElementById('result').innerText = "Time's up!";
            document.getElementById('result').className = "incorrect";
            document.getElementById('timeout-sound').play();

            riddleCount++;
            if (riddleCount >= 2) {
                currentAnswerLength++;
                riddleCount = 0;
            }

            setTimeout(nextRiddle, 2000);
        }
    }, 1000);  // Update every second
}

// Stop the timer
function stopTimer() {
    clearInterval(timerInterval);  // Stop the timer
}

// Animate dollar counter
function animateDollarCounter(targetAmount) {
    const counterElement = document.getElementById('earnings');
    const currentAmount = parseInt(counterElement.innerText.replace('Earnings: $', '')) || 0;
    const increment = (targetAmount - currentAmount) / 20;  // Divide the difference into 20 steps

    let step = 0;
    const interval = setInterval(() => {
        step++;
        const newAmount = Math.min(currentAmount + step * increment, targetAmount);
        counterElement.innerText = `Earnings: $${Math.floor(newAmount)}`;

        if (step >= 20) {
            clearInterval(interval);
            counterElement.innerText = `Earnings: $${targetAmount}`;
        }
    }, 25);  // Update every 25ms for smooth animation
}

// Move to the next input box when typing
function moveToNextBox(event, index) {
    const currentBox = document.getElementById(`char-${index}`);
    const nextBox = document.getElementById(`char-${index + 1}`);

    if (currentBox.value.length === 1 && nextBox) {
        nextBox.focus();  // Move to the next box if it exists
    }
}

// Handle backspace to move to the previous box
function handleBackspace(event, index) {
    const currentBox = document.getElementById(`char-${index}`);
    const prevBox = document.getElementById(`char-${index - 1}`);

    if (event.key === 'Backspace' && currentBox.value === '' && prevBox) {
        prevBox.focus();  // Move to the previous box if backspace is pressed on an empty box
    }
}

// End the game and display the final message
function endGame() {
    document.getElementById('riddle-container').style.display = 'none';
    document.getElementById('earnings').style.display = 'none';
    document.getElementById('result').innerText = `End of the game! You won $${totalEarnings}`;
    document.getElementById('result').className = "correct";
    document.getElementById('start-button').style.display = 'block';
    document.getElementById('start-button').innerText = 'Play Again';
    currentAnswerLength = 3;
    totalEarnings = 0;
    riddleCount = 0;
}

// Check if hint availability should be disabled
function checkHintAvailability() {
    const emptyBoxes = Array.from(document.querySelectorAll('.answer-box')).filter(
        (box) => box.value === ''
    );

    document.getElementById('hint-button').disabled = emptyBoxes.length <= 1;
}

// Provide a hint by revealing a random character
function getHint() {
    totalEarnings -= 10;
    document.getElementById('earnings').innerText = `Earnings: $${totalEarnings}`;

    // Find unrevealed characters
    let unrevealedIndices = [];
    for (let i = 0; i < currentAnswerLength; i++) {
        const charBox = document.getElementById(`char-${i}`);
        if (charBox.value === '') {
            unrevealedIndices.push(i);
        }
    }

    if (unrevealedIndices.length > 0) {
        const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        document.getElementById(`char-${randomIndex}`).value = correctAnswer[randomIndex];
    }

    checkHintAvailability();
}
