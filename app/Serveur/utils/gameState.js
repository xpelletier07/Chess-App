import { Chess } from 'chess.js';

export function getColor(row, userId) {
  if (row.creator_id === userId) return 'w';
  if (row.joiner_id === userId) return 'b';
  return null;
}

export function toState(row, userId) {
  const chess = new Chess();
  if (row.pgn) chess.loadPgn(row.pgn);

  const verbose = chess.history({ verbose: true });
  const last = verbose[verbose.length - 1];

  return {
    code: row.code,
    fen: row.fen,
    turn: chess.turn(),
    result: row.result,
    color: getColor(row, userId),
    hasOpponent: row.joiner_id !== null,
    history: verbose.map((m) => m.san),
    lastMove: last ? { from: last.from, to: last.to } : null,
    version: row.move_count,
  };
}