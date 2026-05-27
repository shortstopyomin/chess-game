/**
 * Grandmaster Chess - AI Player Web Worker
 * Uses Minimax with Alpha-Beta Pruning and Piece-Square Tables (PST).
 */

// Import the chess engine logic
importScripts('chess-engine.js');

// Piece Weights
const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

// Piece-Square Tables (PST) from White's perspective.
// Higher value is better for White.
// Row 0 is Rank 8 (Top/Black), Row 7 is Rank 1 (Bottom/White).

const PST_PAWN = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_KNIGHT = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const PST_BISHOP = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

const PST_ROOK = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];

const PST_QUEEN = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

// King Middle-game position table
const PST_KING_MIDDLE = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
];

// King End-game position table (encourages moving king to the center)
const PST_KING_END = [
    [-50,-40,-30,-20,-20,-30,-40,-50],
    [-30,-20,-10,  0,  0,-10,-20,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-30,  0,  0,  0,  0,-30,-30],
    [-50,-30,-30,-30,-30,-30,-30,-50]
];

/**
 * Assess board evaluation score. Positive is good for White, negative for Black.
 */
function evaluateBoard(board, isEndgame) {
    let totalScore = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const value = PIECE_VALUES[piece.type];
                let pstScore = 0;

                // Query correct PST
                const tableRow = piece.color === 'w' ? r : (7 - r);
                const tableCol = piece.color === 'w' ? c : (7 - c); // mirror file for black (usually symmetric but good practice)

                switch (piece.type) {
                    case 'p': pstScore = PST_PAWN[tableRow][tableCol]; break;
                    case 'n': pstScore = PST_KNIGHT[tableRow][tableCol]; break;
                    case 'b': pstScore = PST_BISHOP[tableRow][tableCol]; break;
                    case 'r': pstScore = PST_ROOK[tableRow][tableCol]; break;
                    case 'q': pstScore = PST_QUEEN[tableRow][tableCol]; break;
                    case 'k': pstScore = isEndgame ? PST_KING_END[tableRow][tableCol] : PST_KING_MIDDLE[tableRow][tableCol]; break;
                }

                const pieceScore = value + pstScore;

                if (piece.color === 'w') {
                    totalScore += pieceScore;
                } else {
                    totalScore -= pieceScore;
                }
            }
        }
    }

    return totalScore;
}

/**
 * Check if the board is in an endgame state.
 * Endgame is defined as: each side has no queens, or if a side has a queen, they have at most one other piece.
 */
function checkEndgame(board) {
    let wMajorCount = 0;
    let bMajorCount = 0;
    let wHasQueen = false;
    let bHasQueen = false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p) {
                if (p.type === 'k') continue;
                if (p.color === 'w') {
                    if (p.type === 'q') wHasQueen = true;
                    else wMajorCount++;
                } else {
                    if (p.type === 'q') bHasQueen = true;
                    else bMajorCount++;
                }
            }
        }
    }

    const wEnd = !wHasQueen || (wHasQueen && wMajorCount <= 1);
    const bEnd = !bHasQueen || (bHasQueen && bMajorCount <= 1);

    return wEnd && bEnd;
}

/**
 * MVV-LVA move ordering logic
 */
function getMovePriority(engine, move) {
    let score = 0;
    const piece = engine.board[move.from.r][move.from.c];
    const target = engine.board[move.to.r][move.to.c];

    // 1. Captures (MVV-LVA)
    if (target) {
        // High victim, low aggressor
        score += 10 * PIECE_VALUES[target.type] - PIECE_VALUES[piece.type];
        score += 10000; // Capture bonus
    }

    // 2. Promotions
    if (move.promotion) {
        score += 8000;
    }

    // 3. Moving to attacked squares (discourage hanging pieces)
    const opponent = piece.color === 'w' ? 'b' : 'w';
    if (engine.isSquareAttacked(move.to.r, move.to.c, opponent)) {
        score -= PIECE_VALUES[piece.type];
    }

    // 4. Giving check
    // Simulating check in moves ordering would be too expensive, but basic sorting by capture handles 90% of order optimization.

    return score;
}

/**
 * Sort moves in-place to maximize Alpha-Beta cutoffs
 */
function sortMoves(engine, moves) {
    moves.forEach(m => {
        m.priority = getMovePriority(engine, m);
    });
    moves.sort((a, b) => b.priority - a.priority);
}

/**
 * Asynchronous Minimax implementation
 */
function minimax(engine, depth, alpha, beta, isMaximizing, isEndgame) {
    if (depth === 0) {
        return { score: evaluateBoard(engine.board, isEndgame) };
    }

    const outcome = engine.checkGameOutcome();
    if (outcome.gameOver) {
        if (outcome.outcome === 'checkmate') {
            // Favor shorter checkmates
            return { score: outcome.winner === 'White' ? (100000 + depth) : (-100000 - depth) };
        }
        return { score: 0 }; // Stalemate / draw
    }

    // Generate moves
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = engine.board[r][c];
            if (piece && piece.color === engine.turn) {
                const legal = engine.getLegalMoves(r, c);
                for (const m of legal) {
                    moves.push({
                        from: { r, c },
                        to: { r: m.r, c: m.c },
                        promotion: m.type === 'promotion' ? 'q' : undefined,
                        type: m.type
                    });
                }
            }
        }
    }

    if (moves.length === 0) {
        // Should have been caught by outcome.gameOver, but acts as fail-safe
        return { score: engine.isCheck(engine.turn) ? (engine.turn === 'w' ? -100000 : 100000) : 0 };
    }

    sortMoves(engine, moves);

    let bestMove = null;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            // Apply move manually to save execution history
            const undoState = engine.cloneState();
            
            // Execute move directly on board matrix to simulate quickly
            engine.move(move.from.r, move.from.c, move.to.r, move.to.c, move.promotion || 'q');

            const evaluation = minimax(engine, depth - 1, alpha, beta, false, isEndgame).score;
            
            // Undo
            engine.undo();

            if (evaluation > maxEval) {
                maxEval = evaluation;
                bestMove = move;
            }
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            // Apply move
            const undoState = engine.cloneState();
            engine.move(move.from.r, move.from.c, move.to.r, move.to.c, move.promotion || 'q');

            const evaluation = minimax(engine, depth - 1, alpha, beta, true, isEndgame).score;
            
            // Undo
            engine.undo();

            if (evaluation < minEval) {
                minEval = evaluation;
                bestMove = move;
            }
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return { score: minEval, move: bestMove };
    }
}

/**
 * Handle incoming messages from main UI thread
 */
onmessage = function(e) {
    const { fen, depth } = e.data;
    
    // Initialise a new engine clone instance
    const engine = new ChessEngine(fen);
    const isEndgame = checkEndgame(engine.board);
    
    // AI searches for best moves
    // White is maximizing (+), Black is minimizing (-)
    const isMaximizing = engine.turn === 'w';
    
    console.log(`AI Worker calculating move... depth: ${depth}, turn: ${engine.turn}, isEndgame: ${isEndgame}`);
    const start = performance.now();
    
    const result = minimax(engine, depth, -Infinity, Infinity, isMaximizing, isEndgame);
    
    const duration = performance.now() - start;
    console.log(`AI Worker finished in ${duration.toFixed(1)}ms. Evaluation score: ${result.score}`);
    
    // Post back the selected best move
    postMessage({
        move: result.move,
        score: result.score,
        duration: duration
    });
};
