// 게임 변수들
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
let BLOCK_SIZE;

function setGameSize() {
    const container = document.querySelector('.game-container');
    const h1 = document.querySelector('h1');
    const gameInfo = document.querySelector('.game-info');
    const onScreenControls = document.querySelector('.on-screen-controls');

    // Calculate the vertical space used by other elements
    const otherElementsHeight = h1.offsetHeight + gameInfo.offsetHeight + onScreenControls.offsetHeight + 50; // 50 for margins/paddings

    const availableWidth = container.clientWidth;
    // Subtract a bit more for safety margin
    const availableHeight = window.innerHeight - otherElementsHeight;

    const blockWidth = Math.floor(availableWidth / BOARD_WIDTH);
    const blockHeight = Math.floor(availableHeight / BOARD_HEIGHT);

    // Use the smaller of the two possible block sizes to ensure the board fits both horizontally and vertically
    BLOCK_SIZE = Math.min(blockWidth, blockHeight, 30);

    canvas.width = BOARD_WIDTH * BLOCK_SIZE;
    canvas.height = BOARD_HEIGHT * BLOCK_SIZE;

    // Also adjust the canvas style to center it if needed
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    const nextCanvasSize = BLOCK_SIZE * 3; // Slightly smaller next piece canvas
    nextCanvas.width = nextCanvasSize;
    nextCanvas.height = nextCanvasSize;
}

setGameSize();
window.addEventListener('resize', () => {
    // For simplicity, we ask the user to refresh to resize.
    // A full dynamic resize would require re-initializing the game state.
});

const backgroundColors = ['lightblue', 'lightgreen', 'lightcoral', 'lightpink'];
let currentBgColor = '';

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = true;
let isPaused = false;
let dropTime = 0;
let dropInterval = 1000;

// --- 음향 효과 설정 ---
let audioContext;
const soundEffects = {
    move: { path: 'sounds/move.wav', fallback: { freq: 400, duration: 50 } },
    rotate: { path: 'sounds/rotate.wav', fallback: { freq: 500, duration: 50 } },
    hardDrop: { path: 'sounds/hard_drop.wav', fallback: { freq: 300, duration: 100 } },
    lineClear: { path: 'sounds/line_clear.wav', fallback: { freq: 700, duration: 150 } },
    tetrisClear: { path: 'sounds/tetris_clear.wav', fallback: { freq: 900, duration: 400 } },
    gameOver: { path: 'sounds/game_over.wav', fallback: { freq: 200, duration: 500 } }
};
const loadedSounds = {};

// 정확한 테트리스 블럭 모양의 고양이 이미지 URLs
const catImages = {
    I: 'new_images/new_I.png',
    O: 'new_images/new_O.png',
    T: 'new_images/new_T.png',
    S: 'new_images/new_S.png',
    Z: 'new_images/new_Z.png',
    J: 'new_images/new_J.png',
    L: 'new_images/new_L.png'
};

// 이미지 객체들
const loadedImages = {};

// 테트리스 피스 정의
const pieces = {
    I: [
        [[1, 1, 1, 1]],
        [[1],
        [1],
        [1],
        [1]]
    ],
    O: [
        [[1, 1],
        [1, 1]]
    ],
    T: [
        [[0, 1, 0],
        [1, 1, 1]],
        [[1, 0],
        [1, 1],
        [1, 0]],
        [[1, 1, 1],
        [0, 1, 0]],
        [[0, 1],
        [1, 1],
        [0, 1]]
    ],
    S: [
        [[0, 1, 1],
        [1, 1, 0]],
        [[1, 0],
        [1, 1],
        [0, 1]]
    ],
    Z: [
        [[1, 1, 0],
        [0, 1, 1]],
        [[0, 1],
        [1, 1],
        [1, 0]]
    ],
    J: [
        [[1, 0, 0],
        [1, 1, 1]],
        [[1, 1],
        [1, 0],
        [1, 0]],
        [[1, 1, 1],
        [0, 0, 1]],
        [[0, 1],
        [0, 1],
        [1, 1]]
    ],
    L: [
        [[0, 0, 1],
        [1, 1, 1]],
        [[1, 0],
        [1, 0],
        [1, 1]],
        [[1, 1, 1],
        [1, 0, 0]],
        [[1, 1],
        [0, 1],
        [0, 1]]
    ]
};

// --- 오디오 함수 ---
function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.")
            return null;
        }
    }

    // On mibile, the context may be suspended until a user gesture.
    // This will resume it on the first user interaction.
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    return audioContext;
}

function beep(freq = 523, duration = 100, vol = 0.1) {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    oscillator.frequency.value = freq;
    oscillator.type = "square";
    gain.connect(context.destination);
    gain.gain.value = vol;
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration / 1000);
}

function loadSounds() {
    Object.keys(soundEffects).forEach(name => {
        const sound = soundEffects[name];
        const audio = new Audio();
        audio.src = sound.path;
        audio.onerror = () => {
            console.log(`사운드 파일 로드 실패: ${sound.path}. 비프음으로 대체합니다.`);
            loadedSounds[name] = { error: true };
        };
        audio.oncanplaythrough = () => {
            loadedSounds[name] = audio;
        };
    });
}

function playSound(name) {
    const sound = loadedSounds[name];
    if (sound && !sound.error) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("사운드 재생 오류:", e));
    } else {
        const fallback = soundEffects[name].fallback;
        if (fallback) {
            beep(fallback.freq, fallback.duration);
        }
    }
}

// 이미지 로딩
function loadImages() {
    let loadedCount = 0;
    const totalImages = Object.keys(catImages).length;

    Object.keys(catImages).forEach(type => {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                initGame();
            }
        };
        img.onerror = () => {
            console.log(`Failed to load image for ${type}, using fallback color`);
            loadedCount++;
            if (loadedCount === totalImages) {
                initGame();
            }
        };
        img.src = catImages[type];
        loadedImages[type] = img;
    });
}

// 게임 초기화
function initGame() {
    // loadSounds(); // Defer sound loading until user interaction
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    changeBackgroundColor();

    currentPiece = createNewPiece();
    nextPiece = createNewPiece();

    gameLoop();
}

// 새 피스 생성
function createNewPiece() {
    const types = Object.keys(pieces);
    const type = types[Math.floor(Math.random() * types.length)];

    return {
        type: type,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0,
        rotation: 0,
        shape: pieces[type][0]
    };
}

// --- 조각 이동 및 회전 핸들러 ---
function handleMoveLeft() {
    if (!gameRunning || isPaused) return;
    if (isValidPosition(currentPiece, -1, 0)) {
        currentPiece.x--;
        playSound('move');
        draw();
    }
}

function handleMoveRight() {
    if (!gameRunning || isPaused) return;
    if (isValidPosition(currentPiece, 1, 0)) {
        currentPiece.x++;
        playSound('move');
        draw();
    }
}

function handleMoveDown() {
    if (!gameRunning || isPaused) return;
    if (isValidPosition(currentPiece, 0, 1)) {
        currentPiece.y++;
        draw();
    }
}

function handleRotate() {
    if (!gameRunning || isPaused) return;
    const rotated = rotatePiece(currentPiece);
    if (isValidPosition(rotated)) {
        currentPiece = rotated;
        playSound('rotate');
        draw();
    }
}

// 피스 회전
function rotatePiece(piece) {
    const rotations = pieces[piece.type];
    const nextRotation = (piece.rotation + 1) % rotations.length;
    return {
        ...piece,
        rotation: nextRotation,
        shape: rotations[nextRotation]
    };
}

// 유효한 위치인지 확인
function isValidPosition(piece, deltaX = 0, deltaY = 0) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + deltaX;
                const newY = piece.y + y + deltaY;

                if (newX < 0 || newX >= BOARD_WIDTH ||
                    newY >= BOARD_HEIGHT ||
                    (newY >= 0 && board[newY][newX])) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 피스를 보드에 고정
function placePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.type;
                }
            }
        }
    }
}

// 완성된 라인 제거
function clearLines() {
    let linesCleared = 0;

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }

    if (linesCleared > 0) {
        if (linesCleared === 4) {
            playSound('tetrisClear');
        } else {
            playSound('lineClear');
        }
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(50, 1000 - (level - 1) * 50);

        updateScore();
    }
}

// 점수 업데이트
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

function changeBackgroundColor() {
    let newColor;
    do {
        newColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
    } while (newColor === currentBgColor);
    currentBgColor = newColor;
    canvas.style.backgroundColor = currentBgColor;
}

// 게임 오버 확인
function isGameOver() {
    return !isValidPosition(currentPiece);
}

// 게임 오버 처리
function gameOver() {
    gameRunning = false;
    playSound('gameOver');
    document.getElementById('gameOver').style.display = 'flex';
}

// 새 게임 시작
function startNewGame() {
    score = 0;
    level = 1;
    lines = 0;
    gameRunning = true;
    isPaused = false;
    dropTime = 0;
    dropInterval = 1000;

    document.getElementById('gameOver').style.display = 'none';
    updateScore();
    initGame();
}

// 렌더링
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x]);
            }
        }
    }

    if (currentPiece) {
        drawPiece(ctx, currentPiece);
    }

    drawNextPiece();
}

// 블록 그리기 (보드에 쌓인 블록용)
function drawBlock(context, x, y, type) {
    const drawX = x * BLOCK_SIZE;
    const drawY = y * BLOCK_SIZE;
    const img = loadedImages['I'];

    if (img && img.complete) {
        context.drawImage(img, drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
    } else {
        const colors = {
            I: '#ff9999', O: '#99ff99', T: '#9999ff',
            S: '#ffff99', Z: '#ff99ff', J: '#99ffff', L: '#ffcc99'
        };
        context.fillStyle = colors[type] || '#cccccc';
        context.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeStyle = '#333';
        context.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
    }
}

// 피스 그리기 (고양이 한 마리가 전체 피스 모양으로)
function drawPiece(context, piece) {
    const bounds = getPieceBounds(piece.shape);
    const pieceWidth = bounds.maxX - bounds.minX + 1;
    const pieceHeight = bounds.maxY - bounds.minY + 1;

    const startX = (piece.x + bounds.minX) * BLOCK_SIZE;
    const startY = (piece.y + bounds.minY) * BLOCK_SIZE;
    const totalWidth = pieceWidth * BLOCK_SIZE;
    const totalHeight = pieceHeight * BLOCK_SIZE;

    if (loadedImages[piece.type] && loadedImages[piece.type].complete) {
        context.save();
        context.beginPath();

        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const blockX = (piece.x + x) * BLOCK_SIZE;
                    const blockY = (piece.y + y) * BLOCK_SIZE;
                    context.rect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }

        context.clip();
        context.drawImage(loadedImages[piece.type], startX, startY, totalWidth, totalHeight);
        context.restore();
    } else {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    drawBlock(context, piece.x + x, piece.y + y, piece.type);
                }
            }
        }
    }
}

// 피스의 경계 계산
function getPieceBounds(shape) {
    let minX = shape[0].length, maxX = -1;
    let minY = shape.length, maxY = -1;

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    return { minX, maxX, minY, maxY };
}

// 다음 피스 그리기
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPiece) {
        const bounds = getPieceBounds(nextPiece.shape);
        const pieceWidth = bounds.maxX - bounds.minX + 1;
        const pieceHeight = bounds.maxY - bounds.minY + 1;

        const blockSize = BLOCK_SIZE * 0.5; // Adjusted for smaller canvas
        const totalWidth = pieceWidth * blockSize;
        const totalHeight = pieceHeight * blockSize;

        const offsetX = (nextCanvas.width - totalWidth) / 2;
        const offsetY = (nextCanvas.height - totalHeight) / 2;

        if (loadedImages[nextPiece.type] && loadedImages[nextPiece.type].complete) {
            nextCtx.save();
            nextCtx.beginPath();

            for (let y = 0; y < nextPiece.shape.length; y++) {
                for (let x = 0; x < nextPiece.shape[y].length; x++) {
                    if (nextPiece.shape[y][x]) {
                        const blockX = offsetX + (x - bounds.minX) * blockSize;
                        const blockY = offsetY + (y - bounds.minY) * blockSize;
                        nextCtx.rect(blockX, blockY, blockSize, blockSize);
                    }
                }
            }

            nextCtx.clip();
            nextCtx.drawImage(loadedImages[nextPiece.type], offsetX, offsetY, totalWidth, totalHeight);
            nextCtx.restore();
        } else {
            for (let y = 0; y < nextPiece.shape.length; y++) {
                for (let x = 0; x < nextPiece.shape[y].length; x++) {
                    if (nextPiece.shape[y][x]) {
                        const drawX = offsetX + (x - bounds.minX) * blockSize;
                        const drawY = offsetY + (y - bounds.minY) * blockSize;

                        const colors = {
                            I: '#ff9999', O: '#99ff99', T: '#9999ff',
                            S: '#ffff99', Z: '#ff99ff', J: '#99ffff', L: '#ffcc99'
                        };
                        nextCtx.fillStyle = colors[nextPiece.type] || '#cccccc';
                        nextCtx.fillRect(drawX, drawY, blockSize, blockSize);
                        nextCtx.strokeStyle = '#333';
                        nextCtx.strokeRect(drawX, drawY, blockSize, blockSize);
                    }
                }
            }
        }
    }
}

// 게임 루프
function gameLoop(timestamp = 0) {
    if (!gameRunning) return;

    if (!isPaused) {
        dropTime += 16;

        if (dropTime >= dropInterval) {
            if (isValidPosition(currentPiece, 0, 1)) {
                currentPiece.y++;
            } else {
                placePiece();
                changeBackgroundColor();
                clearLines();
                currentPiece = nextPiece;
                nextPiece = createNewPiece();

                if (isGameOver()) {
                    gameOver();
                    return;
                }
            }
            dropTime = 0;
        }

        draw();
    }

    requestAnimationFrame(gameLoop);
}

// --- 이벤트 리스너 ---
let soundsInitialized = false;
const initAudio = () => {
    if (soundsInitialized) return;
    getAudioContext();
    loadSounds();
    soundsInitialized = true;
};

document.addEventListener('keydown', (event) => {
    if (!gameRunning) return;

    initAudio();

    if (event.key === 'p' || event.key === 'P') {
        isPaused = !isPaused;
        return;
    }

    if (isPaused) return;

    switch (event.key) {
        case 'ArrowLeft':
            handleMoveLeft();
            break;
        case 'ArrowRight':
            handleMoveRight();
            break;
        case 'ArrowDown':
            handleMoveDown();
            break;
        case 'ArrowUp':
            handleRotate();
            break;
        case ' ':
            while (isValidPosition(currentPiece, 0, 1)) {
                currentPiece.y++;
            }
            playSound('hardDrop');
            draw();
            event.preventDefault();
            break;
    }
});

document.getElementById('btn-left').addEventListener('click', () => {
    initAudio();
    handleMoveLeft();
});
document.getElementById('btn-right').addEventListener('click', () => {
    initAudio();
    handleMoveRight();
});
document.getElementById('btn-down').addEventListener('click', () => {
    initAudio();
    handleMoveDown();
});
document.getElementById('btn-rotate').addEventListener('click', () => {
    initAudio();
    handleRotate();
});

// 게임 시작
loadImages();

// --- Next Piece Toggle Functionality ---
const nextPieceContainer = document.querySelector('.next-piece-container');

if (nextPieceContainer) {
    nextPieceContainer.addEventListener('click', () => {
        // Only apply this logic on smaller screens where the container is positioned absolutely
        if (window.innerWidth <= 480) {
            nextPieceContainer.classList.toggle('minimized');
        }
    });
}