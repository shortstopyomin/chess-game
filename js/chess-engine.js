/**
 * Grandmaster Chess - Rules & Game Logic Engine
 */

class ChessEngine {
    constructor(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        this.reset();
        this.loadFEN(fen);
    }

    reset() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.turn = 'w';
        this.castlingRights = {
            w: { k: true, q: true },
            b: { k: true, q: true }
        };
        this.enPassant = null; // { r, c }
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.history = [];
        this.redoStack = [];
        this.moveHistoryLog = []; // [{ san: "e4", fen: "...", move: {from, to} }]
        this.capturedPieces = {
            w: [], // Pieces captured by White (i.e. Black pieces)
            b: []  // Pieces captured by Black (i.e. White pieces)
        };
    }

    /**
     * Parse FEN string and load board state
     */
    loadFEN(fen) {
        try {
            this.reset();
            const parts = fen.trim().split(/\s+/);
            if (parts.length < 1) throw new Error("Invalid FEN: empty");

            // 1. Board positions
            const rows = parts[0].split('/');
            if (rows.length !== 8) throw new Error("Invalid FEN: must have 8 ranks");

            for (let r = 0; r < 8; r++) {
                let c = 0;
                for (let i = 0; i < rows[r].length; i++) {
                    const char = rows[r][i];
                    if (/[1-8]/.test(char)) {
                        c += parseInt(char, 10);
                    } else {
                        const color = char === char.toUpperCase() ? 'w' : 'b';
                        const type = char.toLowerCase();
                        this.board[r][c] = { type, color };
                        c++;
                    }
                }
                if (c !== 8) throw new Error(`Invalid FEN: rank ${8-r} has width ${c}`);
            }

            // 2. Active turn
            if (parts.length > 1) {
                this.turn = parts[1] === 'b' ? 'b' : 'w';
            }

            // 3. Castling rights
            if (parts.length > 2) {
                const castling = parts[2];
                this.castlingRights.w.k = castling.includes('K');
                this.castlingRights.w.q = castling.includes('Q');
                this.castlingRights.b.k = castling.includes('k');
                this.castlingRights.b.q = castling.includes('q');
            }

            // 4. En Passant target square
            if (parts.length > 3 && parts[3] !== '-') {
                const epSquare = parts[3];
                const file = epSquare.charCodeAt(0) - 97; // 'a' = 97
                const rank = 8 - parseInt(epSquare[1], 10);
                this.enPassant = { r: rank, c: file };
            }

            // 5. Halfmove clock
            if (parts.length > 4) {
                this.halfMoveClock = parseInt(parts[4], 10) || 0;
            }

            // 6. Fullmove number
            if (parts.length > 5) {
                this.fullMoveNumber = parseInt(parts[5], 10) || 1;
            }

            // Recalculate captured pieces from the initial board state
            this.recalculateCaptures();
            
            return true;
        } catch (e) {
            console.error("Failed to load FEN:", e);
            return false;
        }
    }

    /**
     * Generate FEN string from current board state
     */
    generateFEN() {
        const fenRows = [];
        for (let r = 0; r < 8; r++) {
            let emptyCount = 0;
            let rowStr = '';
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece === null) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        rowStr += emptyCount;
                        emptyCount = 0;
                    }
                    rowStr += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                }
            }
            if (emptyCount > 0) {
                rowStr += emptyCount;
            }
            fenRows.push(rowStr);
        }

        const fenBoard = fenRows.join('/');
        const fenTurn = this.turn;
        
        let fenCastling = '';
        if (this.castlingRights.w.k) fenCastling += 'K';
        if (this.castlingRights.w.q) fenCastling += 'Q';
        if (this.castlingRights.b.k) fenCastling += 'k';
        if (this.castlingRights.b.q) fenCastling += 'q';
        if (fenCastling === '') fenCastling = '-';

        let fenEP = '-';
        if (this.enPassant) {
            const fileStr = String.fromCharCode(97 + this.enPassant.c);
            const rankStr = 8 - this.enPassant.r;
            fenEP = fileStr + rankStr;
        }

        return `${fenBoard} ${fenTurn} ${fenCastling} ${fenEP} ${this.halfMoveClock} ${this.fullMoveNumber}`;
    }

    /**
     * Recalculate captured pieces based on standard piece set minus what's on board
     */
    recalculateCaptures() {
        const totalWhite = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
        const totalBlack = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

        // Count what is currently on the board
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece) {
                    if (piece.color === 'w') {
                        totalWhite[piece.type] = Math.max(0, totalWhite[piece.type] - 1);
                    } else {
                        totalBlack[piece.type] = Math.max(0, totalBlack[piece.type] - 1);
                    }
                }
            }
        }

        // White captured these black pieces (reduce totals)
        this.capturedPieces.w = [];
        for (const [type, count] of Object.entries(totalBlack)) {
            if (type === 'k') continue;
            for (let i = 0; i < count; i++) {
                this.capturedPieces.w.push({ type, color: 'b' });
            }
        }

        // Black captured these white pieces
        this.capturedPieces.b = [];
        for (const [type, count] of Object.entries(totalWhite)) {
            if (type === 'k') continue;
            for (let i = 0; i < count; i++) {
                this.capturedPieces.b.push({ type, color: 'w' });
            }
        }
    }

    /**
     * Deep copy state helper
     */
    cloneState() {
        return {
            board: this.board.map(row => row.map(p => p ? { ...p } : null)),
            turn: this.turn,
            castlingRights: {
                w: { ...this.castlingRights.w },
                b: { ...this.castlingRights.b }
            },
            enPassant: this.enPassant ? { ...this.enPassant } : null,
            halfMoveClock: this.halfMoveClock,
            fullMoveNumber: this.fullMoveNumber,
            capturedPieces: {
                w: [...this.capturedPieces.w],
                b: [...this.capturedPieces.b]
            }
        };
    }

    /**
     * Check if coordinates are inside the board bounds
     */
    inBounds(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    /**
     * Core Move Execution. Validates and plays a move.
     * Returns a move result object if successful, null otherwise.
     */
    move(fromR, fromC, toR, toC, promotionPiece = 'q') {
        const legalMoves = this.getLegalMoves(fromR, fromC);
        const selectedMove = legalMoves.find(m => m.r === toR && m.c === toC);

        if (!selectedMove) {
            return null; // Move is not legal
        }

        // Push current state to undo history
        this.history.push(this.cloneState());
        this.redoStack = []; // Clear redo stack on new move

        const piece = this.board[fromR][fromC];
        const target = this.board[toR][toC];
        
        let captured = target;
        let isPromotion = false;
        let isCastling = false;
        let isEnPassant = false;
        let castlingSide = null;

        // Reset halfmove clock; it increments unless pawn move or capture occurs
        let resetHalfmove = false;
        if (piece.type === 'p' || target !== null) {
            resetHalfmove = true;
        }

        // Handle move types
        if (selectedMove.type === 'castling') {
            isCastling = true;
            const rookRow = fromR;
            if (toC === 6) { // King side
                castlingSide = 'k';
                const rook = this.board[rookRow][7];
                this.board[rookRow][5] = rook;
                this.board[rookRow][7] = null;
            } else if (toC === 2) { // Queen side
                castlingSide = 'q';
                const rook = this.board[rookRow][0];
                this.board[rookRow][3] = rook;
                this.board[rookRow][0] = null;
            }
            this.board[toR][toC] = piece;
            this.board[fromR][fromC] = null;
        } else if (selectedMove.type === 'en-passant') {
            isEnPassant = true;
            const epRow = fromR;
            const epCol = toC;
            captured = this.board[epRow][epCol];
            this.board[epRow][epCol] = null; // Remove captured pawn
            this.board[toR][toC] = piece;
            this.board[fromR][fromC] = null;
        } else if (selectedMove.type === 'promotion') {
            isPromotion = true;
            this.board[toR][toC] = { type: promotionPiece.toLowerCase(), color: piece.color };
            this.board[fromR][fromC] = null;
        } else {
            // Standard Move
            this.board[toR][toC] = piece;
            this.board[fromR][fromC] = null;
        }

        // Update captured pieces record
        if (captured) {
            if (this.turn === 'w') {
                this.capturedPieces.w.push(captured);
            } else {
                this.capturedPieces.b.push(captured);
            }
        }

        // Manage En Passant state
        if (piece.type === 'p' && Math.abs(toR - fromR) === 2) {
            this.enPassant = {
                r: (fromR + toR) / 2,
                c: fromC
            };
        } else {
            this.enPassant = null;
        }

        // Manage Castling Rights
        // 1. King moves
        if (piece.type === 'k') {
            this.castlingRights[piece.color].k = false;
            this.castlingRights[piece.color].q = false;
        }
        // 2. Rook moves or gets captured
        if (piece.type === 'r') {
            if (fromR === 7 && fromC === 0) this.castlingRights.w.q = false;
            if (fromR === 7 && fromC === 7) this.castlingRights.w.k = false;
            if (fromR === 0 && fromC === 0) this.castlingRights.b.q = false;
            if (fromR === 0 && fromC === 7) this.castlingRights.b.k = false;
        }
        if (captured && captured.type === 'r') {
            if (toR === 7 && toC === 0) this.castlingRights.w.q = false;
            if (toR === 7 && toC === 7) this.castlingRights.w.k = false;
            if (toR === 0 && toC === 0) this.castlingRights.b.q = false;
            if (toR === 0 && toC === 7) this.castlingRights.b.k = false;
        }

        // 50-move clock increment/reset
        if (resetHalfmove) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }

        // Fullmove increments after black's turn
        if (this.turn === 'b') {
            this.fullMoveNumber++;
        }

        // Generate Algebraic Move notation BEFORE switching turn (needed for check/mate indicators)
        const nextTurn = this.turn === 'w' ? 'b' : 'w';
        const opponentInCheck = this.isCheck(nextTurn);
        const opponentInCheckmate = opponentInCheck && this.hasNoLegalMoves(nextTurn);
        
        const moveSAN = this.getMoveSAN(
            piece, fromR, fromC, toR, toC, 
            captured !== null, isCastling, castlingSide, isPromotion, promotionPiece,
            opponentInCheck, opponentInCheckmate
        );

        // Switch active player
        this.turn = nextTurn;

        const result = {
            san: moveSAN,
            from: { r: fromR, c: fromC },
            to: { r: toR, c: toC },
            piece,
            captured,
            isCheck: opponentInCheck,
            isCheckmate: opponentInCheckmate,
            isStalemate: !opponentInCheck && this.hasNoLegalMoves(this.turn),
            fenAfter: this.generateFEN()
        };

        this.moveHistoryLog.push({
            san: moveSAN,
            fen: result.fenAfter,
            move: { from: { r: fromR, c: fromC }, to: { r: toR, c: toC } }
        });

        return result;
    }

    /**
     * Revert the last move
     */
    undo() {
        if (this.history.length === 0) return null;

        // Push current state to redo
        this.redoStack.push(this.cloneState());

        const prevState = this.history.pop();
        this.board = prevState.board;
        this.turn = prevState.turn;
        this.castlingRights = prevState.castlingRights;
        this.enPassant = prevState.enPassant;
        this.halfMoveClock = prevState.halfMoveClock;
        this.fullMoveNumber = prevState.fullMoveNumber;
        this.capturedPieces = prevState.capturedPieces;

        // Remove last entry in log
        const undoneMove = this.moveHistoryLog.pop();

        return undoneMove;
    }

    /**
     * Apply the next move from the redo stack
     */
    redo() {
        if (this.redoStack.length === 0) return null;

        this.history.push(this.cloneState());

        const nextState = this.redoStack.pop();
        this.board = nextState.board;
        this.turn = nextState.turn;
        this.castlingRights = nextState.castlingRights;
        this.enPassant = nextState.enPassant;
        this.halfMoveClock = nextState.halfMoveClock;
        this.fullMoveNumber = nextState.fullMoveNumber;
        this.capturedPieces = nextState.capturedPieces;

        // Note: Re-syncing SAN log is easiest via saving it in history state or FEN stack.
        // For simplicity, we just rebuild FEN and refresh board UI.
        return true;
    }

    /**
     * Generate standard algebraic notation (SAN) for moves
     */
    getMoveSAN(piece, fromR, fromC, toR, toC, isCapture, isCastling, castlingSide, isPromotion, promotionPiece, inCheck, inCheckmate) {
        if (isCastling) {
            return castlingSide === 'k' ? 'O-O' : 'O-O-O';
        }

        let san = '';

        if (piece.type === 'p') {
            if (isCapture) {
                san += String.fromCharCode(97 + fromC); // file name e.g. 'e'
            }
        } else {
            san += piece.type.toUpperCase();
            
            // Disambiguation: check if multiple identical pieces can move to target square
            const disambiguate = this.getDisambiguation(piece, fromR, fromC, toR, toC);
            san += disambiguate;
        }

        if (isCapture) {
            san += 'x';
        }

        san += String.fromCharCode(97 + toC) + (8 - toR);

        if (isPromotion) {
            san += '=' + promotionPiece.toUpperCase();
        }

        if (inCheckmate) {
            san += '#';
        } else if (inCheck) {
            san += '+';
        }

        return san;
    }

    /**
     * Compute file/rank disambiguation details for move histories
     */
    getDisambiguation(piece, fromR, fromC, toR, toC) {
        let sameTypePiecesCanMove = [];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r === fromR && c === fromC) continue;
                
                const p = this.board[r][c];
                if (p && p.type === piece.type && p.color === piece.color) {
                    const legal = this.getLegalMoves(r, c);
                    if (legal.some(m => m.r === toR && m.c === toC)) {
                        sameTypePiecesCanMove.push({ r, c });
                    }
                }
            }
        }

        if (sameTypePiecesCanMove.length === 0) return '';

        // If files are different, disambiguate by file
        const diffFile = sameTypePiecesCanMove.every(p => p.c !== fromC);
        if (diffFile) {
            return String.fromCharCode(97 + fromC);
        }

        // If ranks are different, disambiguate by rank
        const diffRank = sameTypePiecesCanMove.every(p => p.r !== fromR);
        if (diffRank) {
            return (8 - fromR).toString();
        }

        // Otherwise disambiguate by both
        return String.fromCharCode(97 + fromC) + (8 - fromR);
    }

    /**
     * Get legal moves for piece at row, col.
     * Generates all pseudo-legal moves, then filters out those that would leave king in check.
     */
    getLegalMoves(r, c) {
        const piece = this.board[r][c];
        if (!piece || piece.color !== this.turn) return [];

        const pseudoMoves = this.getPseudoLegalMoves(r, c);
        const legalMoves = [];

        for (const move of pseudoMoves) {
            if (!this.wouldMovePutKingInCheck(r, c, move.r, move.c, move.type)) {
                legalMoves.push(move);
            }
        }

        return legalMoves;
    }

    /**
     * Checks if executing this move would leave the friendly king under attack
     */
    wouldMovePutKingInCheck(fromR, fromC, toR, toC, moveType) {
        // Backup board & special variables
        const piece = this.board[fromR][fromC];
        const target = this.board[toR][toC];
        const savedEP = this.enPassant;
        const savedCastling = {
            w: { ...this.castlingRights.w },
            b: { ...this.castlingRights.b }
        };

        // Simulate the move
        let epCapturedPiece = null;
        let epCapturedR = null, epCapturedC = null;
        
        this.board[fromR][fromC] = null;
        
        if (moveType === 'en-passant') {
            epCapturedR = fromR;
            epCapturedC = toC;
            epCapturedPiece = this.board[epCapturedR][epCapturedC];
            this.board[epCapturedR][epCapturedC] = null;
            this.board[toR][toC] = piece;
        } else if (moveType === 'promotion') {
            this.board[toR][toC] = { type: 'q', color: piece.color }; // queen promotion mock
        } else {
            this.board[toR][toC] = piece;
        }

        // Check if color is in check after the simulated move
        const inCheck = this.isCheck(piece.color);

        // Restore board
        this.board[fromR][fromC] = piece;
        this.board[toR][toC] = target;
        if (moveType === 'en-passant' && epCapturedPiece) {
            this.board[epCapturedR][epCapturedC] = epCapturedPiece;
        }
        this.enPassant = savedEP;
        this.castlingRights = savedCastling;

        return inCheck;
    }

    /**
     * Checks if a color has any legal moves anywhere
     */
    hasNoLegalMoves(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === color) {
                    // Temporarily set turn to this color if calling externally
                    const savedTurn = this.turn;
                    this.turn = color;
                    const moves = this.getLegalMoves(r, c);
                    this.turn = savedTurn;
                    if (moves.length > 0) return false;
                }
            }
        }
        return true;
    }

    /**
     * Checkmate detection
     */
    isCheckmate(color) {
        return this.isCheck(color) && this.hasNoLegalMoves(color);
    }

    /**
     * Stalemate detection
     */
    isStalemate(color) {
        return !this.isCheck(color) && this.hasNoLegalMoves(color);
    }

    /**
     * General Win/Draw outcome checker
     */
    checkGameOutcome() {
        if (this.isCheckmate(this.turn)) {
            const winner = this.turn === 'w' ? 'Black' : 'White';
            return { gameOver: true, outcome: 'checkmate', winner, reason: `${winner} wins by checkmate.` };
        }
        if (this.isStalemate(this.turn)) {
            return { gameOver: true, outcome: 'stalemate', winner: null, reason: 'Draw by stalemate.' };
        }
        if (this.halfMoveClock >= 100) {
            return { gameOver: true, outcome: '50-moves', winner: null, reason: 'Draw by 50-move rule.' };
        }
        if (this.isInsufficientMaterial()) {
            return { gameOver: true, outcome: 'insufficient-material', winner: null, reason: 'Draw by insufficient material.' };
        }
        if (this.isThreefoldRepetition()) {
            return { gameOver: true, outcome: 'threefold-repetition', winner: null, reason: 'Draw by threefold repetition.' };
        }
        return { gameOver: false, outcome: null, winner: null };
    }

    /**
     * Check if game is drawn due to lack of mating material
     */
    isInsufficientMaterial() {
        let whitePieces = [];
        let blackPieces = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p) {
                    if (p.type === 'k') continue;
                    if (p.color === 'w') whitePieces.push(p);
                    else blackPieces.push(p);
                }
            }
        }

        const wCount = whitePieces.length;
        const bCount = blackPieces.length;

        // 1. King vs King
        if (wCount === 0 && bCount === 0) return true;

        // 2. King + Knight vs King
        if ((wCount === 1 && whitePieces[0].type === 'n' && bCount === 0) ||
            (bCount === 1 && blackPieces[0].type === 'n' && wCount === 0)) return true;

        // 3. King + Bishop vs King
        if ((wCount === 1 && whitePieces[0].type === 'b' && bCount === 0) ||
            (bCount === 1 && blackPieces[0].type === 'b' && wCount === 0)) return true;

        // 4. King + Bishop vs King + Bishop (on same square color)
        // (Checking square color: (r + c) % 2 === 0 or 1. If both are on same color squares, it's a draw)
        if (wCount === 1 && whitePieces[0].type === 'b' && bCount === 1 && blackPieces[0].type === 'b') {
            let wSqColor, bSqColor;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const p = this.board[r][c];
                    if (p && p.type === 'b') {
                        if (p.color === 'w') wSqColor = (r + c) % 2;
                        else bSqColor = (r + c) % 2;
                    }
                }
            }
            if (wSqColor === bSqColor) return true;
        }

        return false;
    }

    /**
     * Check threefold repetition from history states FEN matching (excluding move clocks)
     */
    isThreefoldRepetition() {
        if (this.history.length < 8) return false;
        
        // FEN format standardises comparison, strip clocks (last 2 parts)
        const cleanFEN = fen => fen.split(' ').slice(0, 4).join(' ');
        const currentCleanFEN = cleanFEN(this.generateFEN());
        
        let repeats = 1;
        // Count history states FENs matching the current state
        for (const state of this.history) {
            // Rebuild FEN for history state (for simplicity, we can parse history log or state generating)
            // Storing state's FEN directly in history or recreating it:
            // Since we clone board, let's create FEN from the cloned state:
            const tempEngine = new ChessEngine();
            Object.assign(tempEngine, state);
            const stateCleanFEN = cleanFEN(tempEngine.generateFEN());
            if (stateCleanFEN === currentCleanFEN) {
                repeats++;
            }
        }
        return repeats >= 3;
    }

    /**
     * Check if the King of targetColor is under attack
     */
    isCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false; // Fail-safe (should never happen in valid chess)
        
        const opponent = color === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(kingPos.r, kingPos.c, opponent);
    }

    /**
     * Find coordinates of king for a color
     */
    findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'k' && piece.color === color) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    /**
     * Check if square r, c is attacked by any piece of attackerColor
     */
    isSquareAttacked(r, c, attackerColor) {
        // Direct checks from target square outward simulating opposing attacks
        
        // 1. Knight attacks
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc)) {
                const piece = this.board[nr][nc];
                if (piece && piece.color === attackerColor && piece.type === 'n') return true;
            }
        }

        // 2. Pawn attacks
        const pawnDir = attackerColor === 'w' ? 1 : -1; // Pawns move down if black (attacker white = checking from bottom)
        const pawnCaptures = [[pawnDir, -1], [pawnDir, 1]];
        for (const [dr, dc] of pawnCaptures) {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc)) {
                const piece = this.board[nr][nc];
                if (piece && piece.color === attackerColor && piece.type === 'p') return true;
            }
        }

        // 3. Diagonal attacks (Bishop / Queen)
        const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagonals) {
            let nr = r + dr, nc = c + dc;
            while (this.inBounds(nr, nc)) {
                const piece = this.board[nr][nc];
                if (piece) {
                    if (piece.color === attackerColor && (piece.type === 'b' || piece.type === 'q')) {
                        return true;
                    }
                    break; // Blocked
                }
                nr += dr; nc += dc;
            }
        }

        // 4. Straight attacks (Rook / Queen)
        const straights = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of straights) {
            let nr = r + dr, nc = c + dc;
            while (this.inBounds(nr, nc)) {
                const piece = this.board[nr][nc];
                if (piece) {
                    if (piece.color === attackerColor && (piece.type === 'r' || piece.type === 'q')) {
                        return true;
                    }
                    break; // Blocked
                }
                nr += dr; nc += dc;
            }
        }

        // 5. King attacks (adjacent squares)
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        for (const [dr, dc] of kingMoves) {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc)) {
                const piece = this.board[nr][nc];
                if (piece && piece.color === attackerColor && piece.type === 'k') return true;
            }
        }

        return false;
    }

    /**
     * Generates all pseudo-legal moves for a piece (without filtering moves leaving King in check)
     */
    getPseudoLegalMoves(r, c) {
        const piece = this.board[r][c];
        if (!piece) return [];

        const moves = [];
        const color = piece.color;
        const enemy = color === 'w' ? 'b' : 'w';

        switch (piece.type) {
            case 'p': {
                const dir = color === 'w' ? -1 : 1;
                const startRow = color === 'w' ? 6 : 1;
                const promoRow = color === 'w' ? 0 : 7;

                // 1. One step forward
                const fRow = r + dir;
                if (this.inBounds(fRow, c) && this.board[fRow][c] === null) {
                    if (fRow === promoRow) {
                        moves.push({ r: fRow, c, type: 'promotion' });
                    } else {
                        moves.push({ r: fRow, c, type: 'normal' });
                    }

                    // 2. Two steps forward from start
                    const ffRow = r + 2 * dir;
                    if (r === startRow && this.board[ffRow][c] === null) {
                        moves.push({ r: ffRow, c, type: 'normal' });
                    }
                }

                // 3. Diagonal captures
                const captures = [[dir, -1], [dir, 1]];
                for (const [dr, dc] of captures) {
                    const targetR = r + dr, targetC = c + dc;
                    if (this.inBounds(targetR, targetC)) {
                        const targetPiece = this.board[targetR][targetC];
                        if (targetPiece && targetPiece.color === enemy) {
                            if (targetR === promoRow) {
                                moves.push({ r: targetR, c: targetC, type: 'promotion' });
                            } else {
                                moves.push({ r: targetR, c: targetC, type: 'normal' });
                            }
                        }
                        
                        // En Passant capture
                        if (this.enPassant && this.enPassant.r === targetR && this.enPassant.c === targetC) {
                            moves.push({ r: targetR, c: targetC, type: 'en-passant' });
                        }
                    }
                }
                break;
            }
            case 'n': {
                const jumps = [
                    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                    [1, -2], [1, 2], [2, -1], [2, 1]
                ];
                for (const [dr, dc] of jumps) {
                    const nr = r + dr, nc = c + dc;
                    if (this.inBounds(nr, nc)) {
                        const target = this.board[nr][nc];
                        if (target === null || target.color === enemy) {
                            moves.push({ r: nr, c: nc, type: 'normal' });
                        }
                    }
                }
                break;
            }
            case 'b': {
                this.addSlidingMoves(moves, r, c, [[-1, -1], [-1, 1], [1, -1], [1, 1]], enemy);
                break;
            }
            case 'r': {
                this.addSlidingMoves(moves, r, c, [[-1, 0], [1, 0], [0, -1], [0, 1]], enemy);
                break;
            }
            case 'q': {
                this.addSlidingMoves(moves, r, c, [
                    [-1, -1], [-1, 1], [1, -1], [1, 1],
                    [-1, 0], [1, 0], [0, -1], [0, 1]
                ], enemy);
                break;
            }
            case 'k': {
                const steps = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1],  [1, 0],  [1, 1]
                ];
                for (const [dr, dc] of steps) {
                    const nr = r + dr, nc = c + dc;
                    if (this.inBounds(nr, nc)) {
                        const target = this.board[nr][nc];
                        if (target === null || target.color === enemy) {
                            moves.push({ r: nr, c: nc, type: 'normal' });
                        }
                    }
                }

                // Castling
                if (color === this.turn) { // Only allow castling if it is their active turn
                    this.addCastlingMoves(moves, r, c, color);
                }
                break;
            }
        }

        return moves;
    }

    /**
     * Add diagonal or line slides for Bishop, Rook, Queen
     */
    addSlidingMoves(moves, r, c, directions, enemyColor) {
        for (const [dr, dc] of directions) {
            let nr = r + dr, nc = c + dc;
            while (this.inBounds(nr, nc)) {
                const target = this.board[nr][nc];
                if (target === null) {
                    moves.push({ r: nr, c: nc, type: 'normal' });
                } else {
                    if (target.color === enemyColor) {
                        moves.push({ r: nr, c: nc, type: 'normal' });
                    }
                    break; // Blocked by piece
                }
                nr += dr; nc += dc;
            }
        }
    }

    /**
     * Add castling moves for King
     */
    addCastlingMoves(moves, r, c, color) {
        const rights = this.castlingRights[color];
        if (!rights) return;

        const opponent = color === 'w' ? 'b' : 'w';

        // Cannot castle if already in check
        if (this.isSquareAttacked(r, c, opponent)) return;

        // King Side (Kingside)
        if (rights.k) {
            const s1 = this.board[r][5];
            const s2 = this.board[r][6];
            if (s1 === null && s2 === null) {
                // Check if intermediate squares are under attack
                if (!this.isSquareAttacked(r, 5, opponent) && !this.isSquareAttacked(r, 6, opponent)) {
                    moves.push({ r, c: 6, type: 'castling' });
                }
            }
        }

        // Queen Side (Queenside)
        if (rights.q) {
            const s1 = this.board[r][3];
            const s2 = this.board[r][2];
            const s3 = this.board[r][1]; // Must be empty, doesn't need checking for attacks
            if (s1 === null && s2 === null && s3 === null) {
                if (!this.isSquareAttacked(r, 3, opponent) && !this.isSquareAttacked(r, 2, opponent)) {
                    moves.push({ r, c: 2, type: 'castling' });
                }
            }
        }
    }
}

// Export for Web Worker or window scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
} else {
    window.ChessEngine = ChessEngine;
}
