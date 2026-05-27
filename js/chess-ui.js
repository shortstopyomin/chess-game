/**
 * Grandmaster Chess - UI Renderer & Interaction Controller (Pure 2-Player Local version)
 */

// Modern geometric SVGs styled with CSS variables
const PIECE_SVGS = {
    p: (color) => `<svg viewBox="0 0 100 100" class="svg-piece ${color === 'w' ? 'piece-white' : 'piece-black'}">
        <circle cx="50" cy="38" r="14" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" />
        <path d="M36 78 L64 78 L57 52 L43 52 Z" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linejoin="round" />
        <path d="M30 84 L70 84" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="8" stroke-linecap="round" />
    </svg>`,
    r: (color) => `<svg viewBox="0 0 100 100" class="svg-piece ${color === 'w' ? 'piece-white' : 'piece-black'}">
        <path d="M32 78 L68 78 L68 45 L64 45 L64 30 L57 30 L57 38 L50 38 L50 30 L43 30 L43 38 L36 38 L36 30 L28 30 L28 45 L32 45 Z" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linejoin="round" />
        <path d="M26 84 L74 84" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="8" stroke-linecap="round" />
    </svg>`,
    n: (color) => `<svg viewBox="0 0 100 100" class="svg-piece ${color === 'w' ? 'piece-white' : 'piece-black'}">
        <path d="M33 78 L67 78 L67 72 C67 58 72 52 66 38 C60 24 45 22 40 25 C30 28 28 42 33 48 C36 52 38 48 40 45 C41 40 46 41 43 48 C40 55 33 62 33 72 Z" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linejoin="round" />
        <circle cx="48" cy="36" r="3.5" fill="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" />
        <path d="M27 84 L73 84" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="8" stroke-linecap="round" />
    </svg>`,
    b: (color) => `<svg viewBox="0 0 100 100" class="svg-piece ${color === 'w' ? 'piece-white' : 'piece-black'}">
        <path d="M50 22 C37 36 37 64 50 78 C63 64 63 36 50 22 Z" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linejoin="round" />
        <circle cx="50" cy="18" r="4.5" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="4.5" />
        <path d="M42 46 L58 46" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="5.5" stroke-linecap="round" />
        <path d="M50 38 L50 54" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="5.5" stroke-linecap="round" />
        <path d="M30 78 L70 78" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linecap="round" />
        <path d="M25 84 L75 84" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="8" stroke-linecap="round" />
    </svg>`,
    q: (color) => `<svg viewBox="0 0 100 100" class="svg-piece ${color === 'w' ? 'piece-white' : 'piece-black'}">
        <path d="M30 78 L70 78 L75 42 L60 56 L50 30 L40 56 L25 42 Z" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linejoin="round" />
        <circle cx="25" cy="38" r="3.5" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="3" />
        <circle cx="40" cy="52" r="3.5" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="3" />
        <circle cx="50" cy="26" r="3.5" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="3" />
        <circle cx="60" cy="52" r="3.5" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="3" />
        <circle cx="75" cy="38" r="3.5" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="3" />
        <path d="M25 84 L75 84" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="8" stroke-linecap="round" />
    </svg>`,
    k: (color) => `<svg viewBox="0 0 100 100" class="svg-piece ${color === 'w' ? 'piece-white' : 'piece-black'}">
        <path d="M30 78 L70 78 L75 46 L62 46 L62 36 L55 36 L55 26 L45 26 L45 36 L38 36 L38 46 L25 46 Z" class="${color === 'w' ? 'piece-white-fill' : 'piece-black-fill'}" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linejoin="round" />
        <path d="M50 18 L50 26" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linecap="round" />
        <path d="M44 21 L56 21" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="6" stroke-linecap="round" />
        <path d="M25 84 L75 84" stroke="${color === 'w' ? 'var(--piece-white-stroke)' : 'var(--piece-black-stroke)'}" stroke-width="8" stroke-linecap="round" />
    </svg>`
};

class ChessUI {
    constructor() {
        this.engine = new ChessEngine();
        this.gameMode = 'local'; // Pure 2-Player local mode
        this.selectedSquare = null; // { r, c }
        this.validMoves = []; // List of { r, c, type }
        this.isFlipped = false;
        
        // Clocks & Timers
        this.timeControl = '10'; // In minutes, or 'none'
        this.clocks = { w: 600, b: 600 };
        this.timerInterval = null;
        
        // Drag State
        this.draggedPiece = null;
        this.dragStartSquare = null;
        
        // Modal State
        this.pendingPromotionMove = null; // { fromR, fromC, toR, toC }

        // DOM elements cache
        this.boardEl = document.getElementById('chessboard');
        this.selectClockEl = document.getElementById('select-clock');
        this.selectThemeEl = document.getElementById('select-theme');
        
        this.playerTimerEl = document.getElementById('player-timer');
        this.opponentTimerEl = document.getElementById('opponent-timer');
        this.playerCapturesEl = document.getElementById('player-captures');
        this.opponentCapturesEl = document.getElementById('opponent-captures');
        
        this.btnUndoEl = document.getElementById('btn-undo');
        this.btnRedoEl = document.getElementById('btn-redo');
        this.btnFlipEl = document.getElementById('btn-flip');
        this.btnRestartEl = document.getElementById('btn-restart');
        
        this.movesLogEl = document.getElementById('moves-log');
        this.moveCountEl = document.getElementById('move-count');
        this.fenInputEl = document.getElementById('fen-string-input');
        
        this.promotionOverlayEl = document.getElementById('promotion-overlay');
        this.gameoverOverlayEl = document.getElementById('gameover-overlay');
        
        this.init();
    }

    init() {
        // Attach listeners
        this.attachEventListeners();

        // Restore settings from LocalStorage if available
        this.loadSettings();

        // Start new game
        this.restartGame();
    }

    attachEventListeners() {
        this.selectClockEl.addEventListener('change', () => {
            this.timeControl = this.selectClockEl.value;
            this.saveSettings();
            this.restartGame();
        });

        this.selectThemeEl.addEventListener('change', () => {
            const theme = this.selectThemeEl.value;
            document.body.className = `theme-${theme}`;
            this.saveSettings();
        });

        // Interactive Button Row
        this.btnUndoEl.addEventListener('click', () => {
            this.undoMove();
        });

        this.btnRedoEl.addEventListener('click', () => {
            this.redoMove();
        });

        this.btnFlipEl.addEventListener('click', () => {
            this.isFlipped = !this.isFlipped;
            this.renderBoard();
        });

        this.btnRestartEl.addEventListener('click', () => this.restartGame());
        document.getElementById('btn-restart-modal').addEventListener('click', () => {
            this.gameoverOverlayEl.classList.add('hidden');
            this.restartGame();
        });

        // FEN controls
        document.getElementById('btn-load-fen').addEventListener('click', () => {
            const fen = this.fenInputEl.value.trim();
            if (this.engine.loadFEN(fen)) {
                this.selectedSquare = null;
                this.validMoves = [];
                this.syncWithEngineState();
                this.showFENStatus("FEN loaded successfully!");
            } else {
                this.showFENStatus("Invalid FEN string!", true);
            }
        });

        document.getElementById('btn-copy-fen').addEventListener('click', () => {
            const fen = this.engine.generateFEN();
            navigator.clipboard.writeText(fen).then(() => {
                this.showFENStatus("FEN copied to clipboard!");
            });
        });

        // Promotion modal choice
        document.querySelectorAll('.promo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choice = btn.dataset.piece;
                this.executePendingPromotion(choice);
            });
        });

        // Global drag move listener to track dragging piece coordinates
        window.addEventListener('pointermove', (e) => this.handleDragMove(e));
        window.addEventListener('pointerup', (e) => this.handleDragEnd(e));
    }

    /**
     * Show short feedback messages for FEN actions
     */
    showFENStatus(msg, isError = false) {
        const fenStatus = document.getElementById('fen-status');
        fenStatus.textContent = msg;
        fenStatus.className = isError ? 'status-msg error' : 'status-msg';
        fenStatus.classList.remove('hidden');
        setTimeout(() => {
            fenStatus.classList.add('hidden');
        }, 3000);
    }

    /**
     * Persist game config states to LocalStorage
     */
    saveSettings() {
        const settings = {
            timeControl: this.timeControl,
            theme: this.selectThemeEl.value,
            isFlipped: this.isFlipped
        };
        localStorage.setItem('grandmaster_chess_settings', JSON.stringify(settings));
    }

    /**
     * Pull game config states from LocalStorage
     */
    loadSettings() {
        const settingsRaw = localStorage.getItem('grandmaster_chess_settings');
        if (settingsRaw) {
            try {
                const settings = JSON.parse(settingsRaw);
                this.timeControl = settings.timeControl || '10';
                this.isFlipped = settings.isFlipped || false;
                
                this.selectClockEl.value = this.timeControl;
                this.selectThemeEl.value = settings.theme || 'carbon';
                
                document.body.className = `theme-${settings.theme || 'carbon'}`;
            } catch (e) {
                console.error("Failed to load settings:", e);
            }
        }
    }

    /**
     * Clear and initialize game components
     */
    restartGame() {
        // Reset engine
        this.engine.reset();
        
        // Cancel timers
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        // Set clock starting times
        if (this.timeControl === 'none') {
            document.querySelectorAll('.timer').forEach(el => el.classList.add('hidden'));
        } else {
            document.querySelectorAll('.timer').forEach(el => el.classList.remove('hidden'));
            const secs = parseInt(this.timeControl, 10) * 60;
            this.clocks = { w: secs, b: secs };
            this.updateClockUI();
        }

        this.selectedSquare = null;
        this.validMoves = [];
        this.pendingPromotionMove = null;

        this.syncWithEngineState();
        
        // Hide modals
        this.promotionOverlayEl.classList.add('hidden');
        this.gameoverOverlayEl.classList.add('hidden');
        
        // Play sound only if it's a manual game reload/restart (to avoid autoplay browser locks)
        if (this.engine.history.length > 0) {
            window.chessAudio.playMove();
        }
    }

    /**
     * Sync board layout, turn tags, captured list, logs, and undo buttons
     */
    syncWithEngineState() {
        this.renderBoard();
        this.renderCapturedPieces();
        this.renderMoveHistoryLog();
        this.updateHeaderStatus();
        this.updateUndoRedoButtons();
        
        // If FEN field is not focused, copy current FEN to it
        if (document.activeElement !== this.fenInputEl) {
            this.fenInputEl.value = this.engine.generateFEN();
        }
    }

    /**
     * Create Board Squares DOM elements
     */
    renderBoard() {
        this.boardEl.innerHTML = '';
        
        // Determine draw sequence based on flipped state
        const indices = [0, 1, 2, 3, 4, 5, 6, 7];
        const rows = this.isFlipped ? indices.slice().reverse() : indices;
        const cols = this.isFlipped ? indices.slice().reverse() : indices;

        // Render rank labels (8-1)
        const rankCoordsEl = document.getElementById('rank-coords');
        rankCoordsEl.innerHTML = '';
        const displayRanks = this.isFlipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
        displayRanks.forEach(r => {
            const span = document.createElement('span');
            span.textContent = r;
            rankCoordsEl.appendChild(span);
        });

        // Render file labels (A-H)
        const fileCoordsEl = document.getElementById('file-coords');
        fileCoordsEl.innerHTML = '';
        const displayFiles = this.isFlipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
        displayFiles.forEach(f => {
            const span = document.createElement('span');
            span.textContent = f;
            fileCoordsEl.appendChild(span);
        });

        const lastMove = this.engine.history.length > 0 ? this.engine.moveHistoryLog[this.engine.moveHistoryLog.length - 1] : null;
        const activeKingInCheck = this.engine.isCheck(this.engine.turn) ? this.engine.findKing(this.engine.turn) : null;

        for (const r of rows) {
            for (const c of cols) {
                const square = document.createElement('div');
                const isLight = (r + c) % 2 === 0;
                square.className = `square ${isLight ? 'light' : 'dark'}`;
                square.dataset.row = r;
                square.dataset.col = c;

                const piece = this.engine.board[r][c];

                // Highlights
                // 1. Selection
                if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
                    square.classList.add('selected');
                }
                
                // 2. Last move
                if (lastMove && lastMove.move) {
                    if ((lastMove.move.from.r === r && lastMove.move.from.c === c) || 
                        (lastMove.move.to.r === r && lastMove.move.to.c === c)) {
                        square.classList.add('last-move');
                    }
                }

                // 3. Check State
                if (activeKingInCheck && activeKingInCheck.r === r && activeKingInCheck.c === c) {
                    square.classList.add('in-check');
                }

                // 4. Valid moves indicators
                const validMove = this.validMoves.find(m => m.r === r && m.c === c);
                if (validMove) {
                    square.classList.add('valid-move');
                    if (piece !== null) {
                        square.classList.add('has-piece');
                    }
                }

                // Render piece elements
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = 'piece';
                    pieceEl.dataset.row = r;
                    pieceEl.dataset.col = c;
                    
                    // Render SVG inside piece
                    pieceEl.innerHTML = PIECE_SVGS[piece.type](piece.color);
                    
                    // Wire event handlers
                    pieceEl.addEventListener('pointerdown', (e) => this.handleDragStart(e, pieceEl));
                    
                    square.appendChild(pieceEl);
                }

                // Append click listener on square
                square.addEventListener('pointerdown', (e) => {
                    // Prevent trigger only when clicking on a friendly piece (letting drag-and-drop initiate)
                    const pieceEl = e.target.closest('.piece');
                    if (pieceEl) {
                        const pr = parseInt(pieceEl.dataset.row, 10);
                        const pc = parseInt(pieceEl.dataset.col, 10);
                        const piece = this.engine.board[pr][pc];
                        if (piece && piece.color === this.engine.turn) {
                            return; // Let drag start handle it
                        }
                    }
                    this.handleSquareClick(r, c);
                });

                this.boardEl.appendChild(square);
            }
        }
    }

    /**
     * Render Captured Badges (White and Black captures side-by-side)
     */
    renderCapturedPieces() {
        const unicodeMap = {
            p: '♙', n: '♘', b: '♗', r: '♖', q: '♕'
        };

        // Render black pieces captured by white
        this.playerCapturesEl.innerHTML = '';
        this.engine.capturedPieces.w
            .sort((a, b) => this.getPieceWeight(a.type) - this.getPieceWeight(b.type))
            .forEach(piece => {
                const span = document.createElement('span');
                span.className = 'captured-badge';
                span.textContent = unicodeMap[piece.type];
                this.playerCapturesEl.appendChild(span);
            });

        // Render white pieces captured by black
        this.opponentCapturesEl.innerHTML = '';
        this.engine.capturedPieces.b
            .sort((a, b) => this.getPieceWeight(a.type) - this.getPieceWeight(b.type))
            .forEach(piece => {
                const span = document.createElement('span');
                span.className = 'captured-badge';
                span.textContent = unicodeMap[piece.type];
                this.opponentCapturesEl.appendChild(span);
            });
    }

    getPieceWeight(type) {
        switch (type) {
            case 'p': return 1;
            case 'n': return 3;
            case 'b': return 3;
            case 'r': return 5;
            case 'q': return 9;
            default: return 0;
        }
    }

    /**
     * Render move history panel using standard PGN logs layout
     */
    renderMoveHistoryLog() {
        const log = this.engine.moveHistoryLog;
        this.moveCountEl.textContent = `${log.length} moves`;
        
        if (log.length === 0) {
            this.movesLogEl.innerHTML = '<div class="empty-log-msg">No moves played yet</div>';
            return;
        }

        this.movesLogEl.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'moves-grid';

        for (let i = 0; i < log.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            
            const numEl = document.createElement('div');
            numEl.className = 'move-num';
            numEl.textContent = `${moveNum}.`;
            grid.appendChild(numEl);

            // White Move
            const whiteMove = document.createElement('div');
            whiteMove.className = 'move-val';
            whiteMove.textContent = log[i].san;
            whiteMove.addEventListener('click', () => this.jumpToHistoryState(i));
            if (i === log.length - 1) whiteMove.classList.add('current-step');
            grid.appendChild(whiteMove);

            // Black Move (if exists)
            if (i + 1 < log.length) {
                const blackMove = document.createElement('div');
                blackMove.className = 'move-val';
                blackMove.textContent = log[i+1].san;
                blackMove.addEventListener('click', () => this.jumpToHistoryState(i+1));
                if (i + 1 === log.length - 1) blackMove.classList.add('current-step');
                grid.appendChild(blackMove);
            } else {
                // Spacer
                grid.appendChild(document.createElement('div'));
            }
        }

        this.movesLogEl.appendChild(grid);
        // Scroll move history panel automatically to the bottom
        this.movesLogEl.scrollTop = this.movesLogEl.scrollHeight;
    }

    /**
     * Click handler for move log steps (jump back in history)
     */
    jumpToHistoryState(stepIndex) {
        // Undo or roll back to matching FEN state
        const targetState = this.engine.history[stepIndex + 1];
        if (!targetState) {
            // If selecting current state, do nothing
            if (stepIndex === this.engine.moveHistoryLog.length - 1) return;
        }

        // Loop undo or redo to match history index
        while (this.engine.moveHistoryLog.length - 1 > stepIndex) {
            this.engine.undo();
        }
        
        this.syncWithEngineState();
    }

    /**
     * Toggle action button disabled attributes
     */
    updateUndoRedoButtons() {
        this.btnUndoEl.disabled = this.engine.history.length === 0;
        this.btnRedoEl.disabled = this.engine.redoStack.length === 0;
    }

    /**
     * Update active turn label and timers
     */
    updateHeaderStatus() {
        const statusEl = document.getElementById('header-status');
        const activeColorText = this.engine.turn === 'w' ? 'White' : 'Black';
        
        statusEl.innerHTML = `<span class="pulse-indicator"></span> ${activeColorText}'s Turn`;

        // Highlight active timer bar
        if (this.engine.turn === 'w') {
            document.getElementById('player-info').style.opacity = '1';
            document.getElementById('opponent-info').style.opacity = '0.7';
        } else {
            document.getElementById('player-info').style.opacity = '0.7';
            document.getElementById('opponent-info').style.opacity = '1';
        }
    }

    /**
     * Click and Pointer Handler for squares
     */
    handleSquareClick(r, c) {
        const piece = this.engine.board[r][c];

        // 1. Move selection attempt
        const isValidMove = this.validMoves.find(m => m.r === r && m.c === c);
        if (isValidMove) {
            this.executeMove(this.selectedSquare.r, this.selectedSquare.c, r, c);
            this.selectedSquare = null;
            this.validMoves = [];
            return;
        }

        // 2. Select piece
        if (piece && piece.color === this.engine.turn) {
            window.chessAudio.init(); // Warm AudioContext
            this.selectedSquare = { r, c };
            this.validMoves = this.engine.getLegalMoves(r, c);
            this.renderBoard();
        } else {
            // Cancel selection
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
        }
    }

    /**
     * Execute move on engine, trigger Audio & check game over conditions
     */
    executeMove(fromR, fromC, toR, toC, promoPiece = 'q') {
        const piece = this.engine.board[fromR][fromC];
        const legalMoves = this.engine.getLegalMoves(fromR, fromC);
        const selected = legalMoves.find(m => m.r === toR && m.c === toC);

        if (!selected) return;

        // Check for Pawn Promotion triggering
        if (selected.type === 'promotion' && !this.pendingPromotionMove) {
            this.pendingPromotionMove = { fromR, fromC, toR, toC };
            this.showPromotionModal();
            return;
        }

        // Play move
        const moveResult = this.engine.move(fromR, fromC, toR, toC, promoPiece);
        if (moveResult) {
            // Sound feedback
            if (moveResult.isCheckmate) {
                window.chessAudio.playCheckmate();
            } else if (moveResult.isCheck) {
                window.chessAudio.playCheck();
            } else if (moveResult.captured) {
                window.chessAudio.playCapture();
            } else {
                window.chessAudio.playMove();
            }

            this.selectedSquare = null;
            this.validMoves = [];
            this.pendingPromotionMove = null;

            this.syncWithEngineState();
            
            // Check Outcome
            const status = this.engine.checkGameOutcome();
            if (status.gameOver) {
                this.handleGameOver(status);
                return;
            }

            // Start clock timer on first move
            if (this.timeControl !== 'none' && !this.timerInterval) {
                this.startClockTimer();
            }
        }
    }

    /**
     * Highlight and launch Pawn Promotion overlay
     */
    showPromotionModal() {
        this.promotionOverlayEl.classList.remove('hidden');
    }

    executePendingPromotion(pieceType) {
        if (!this.pendingPromotionMove) return;
        
        const { fromR, fromC, toR, toC } = this.pendingPromotionMove;
        this.pendingPromotionMove = null;
        this.promotionOverlayEl.classList.add('hidden');
        
        this.executeMove(fromR, fromC, toR, toC, pieceType);
    }

    /**
     * Custom Pointer Drag Events
     */
    handleDragStart(e, pieceEl) {
        // Avoid drag conflicts with right click or multi-touch
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        const r = parseInt(pieceEl.dataset.row, 10);
        const c = parseInt(pieceEl.dataset.col, 10);
        const piece = this.engine.board[r][c];

        if (piece && piece.color === this.engine.turn) {
            window.chessAudio.init(); // Warm AudioContext
            
            this.draggedPiece = pieceEl;
            this.dragStartSquare = { r, c };
            
            this.selectedSquare = { r, c };
            this.validMoves = this.engine.getLegalMoves(r, c);
            
            this.renderBoard();
            
            // Setup floating ghost styling
            pieceEl.classList.add('dragging');
            pieceEl.style.left = `${e.clientX}px`;
            pieceEl.style.top = `${e.clientY}px`;
            
            pieceEl.setPointerCapture(e.pointerId);
        }
    }

    handleDragMove(e) {
        if (!this.draggedPiece) return;
        
        this.draggedPiece.style.left = `${e.clientX}px`;
        this.draggedPiece.style.top = `${e.clientY}px`;
    }

    handleDragEnd(e) {
        if (!this.draggedPiece) return;
        
        const pieceEl = this.draggedPiece;
        const fromSquare = this.dragStartSquare;
        
        pieceEl.classList.remove('dragging');
        pieceEl.style.left = '';
        pieceEl.style.top = '';
        pieceEl.releasePointerCapture(e.pointerId);
        
        this.draggedPiece = null;
        this.dragStartSquare = null;

        // Resolve element under point to map destination square
        const targetEl = document.elementFromPoint(e.clientX, e.clientY);
        const squareEl = targetEl ? targetEl.closest('.square') : null;
        
        if (squareEl) {
            const toR = parseInt(squareEl.dataset.row, 10);
            const toC = parseInt(squareEl.dataset.col, 10);
            
            if (fromSquare.r === toR && fromSquare.c === toC) {
                // Same square = treat as click/selection toggle
                this.handleSquareClick(toR, toC);
            } else {
                // Attempt executing drag move
                this.executeMove(fromSquare.r, fromSquare.c, toR, toC);
            }
        } else {
            // Drop out of board: clear selection
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
        }
    }

    /**
     * Undo step helper
     */
    undoMove() {
        this.engine.undo();
        this.selectedSquare = null;
        this.validMoves = [];
        this.syncWithEngineState();
    }

    /**
     * Redo step helper
     */
    redoMove() {
        this.engine.redo();
        this.selectedSquare = null;
        this.validMoves = [];
        this.syncWithEngineState();
    }

    /**
     * Dual countdown timer clocks
     */
    startClockTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            const turn = this.engine.turn;
            
            // Reduce time by 1s
            this.clocks[turn] = Math.max(0, this.clocks[turn] - 1);
            
            this.updateClockUI();

            if (this.clocks[turn] === 0) {
                clearInterval(this.timerInterval);
                this.handleTimeout(turn);
            }
        }, 1000);
    }

    updateClockUI() {
        const formatTime = (totalSecs) => {
            const mins = Math.floor(totalSecs / 60);
            const secs = totalSecs % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        const wText = formatTime(this.clocks.w);
        const bText = formatTime(this.clocks.b);

        this.playerTimerEl.textContent = wText;
        this.opponentTimerEl.textContent = bText;
        
        this.playerTimerEl.className = this.clocks.w <= 20 ? 'timer low-time' : 'timer';
        this.opponentTimerEl.className = this.clocks.b <= 20 ? 'timer low-time' : 'timer';
    }

    handleTimeout(losingColor) {
        const winner = losingColor === 'w' ? 'Black' : 'White';
        window.chessAudio.playCheckmate();
        
        this.handleGameOver({
            gameOver: true,
            winner: winner,
            reason: `${winner} wins on time.`
        });
    }

    /**
     * Display End-of-game overlay modal
     */
    handleGameOver(status) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        let title = "Game Over";
        let reason = status.reason;

        if (status.outcome === 'checkmate') {
            title = "Checkmate!";
        } else if (status.outcome === 'stalemate') {
            title = "Stalemate";
            window.chessAudio.playDraw();
        } else if (status.outcome && status.outcome.includes('repetition')) {
            title = "Draw";
            window.chessAudio.playDraw();
        } else if (status.outcome && status.outcome.includes('material')) {
            title = "Draw";
            window.chessAudio.playDraw();
        }

        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-reason').textContent = reason;
        this.gameoverOverlayEl.classList.remove('hidden');
    }
}

// Instantiate immediately if DOM is already parsed, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        window.chessUI = new ChessUI();
    });
} else {
    window.chessUI = new ChessUI();
}
