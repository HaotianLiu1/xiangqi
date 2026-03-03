export const BOARD_COLS = 9;
export const BOARD_ROWS = 10;

export const PIECE_TYPE = {
  ROOK: 'rook',
  KNIGHT: 'knight',
  ELEPHANT: 'elephant',
  ADVISOR: 'advisor',
  GENERAL: 'general',
  CANNON: 'cannon',
  SOLDIER: 'soldier'
};

export const INITIAL_BOARD = [
  // black
  { id: 'b-rook-1', side: 'black', type: PIECE_TYPE.ROOK, x: 0, y: 0 },
  { id: 'b-knight-1', side: 'black', type: PIECE_TYPE.KNIGHT, x: 1, y: 0 },
  { id: 'b-elephant-1', side: 'black', type: PIECE_TYPE.ELEPHANT, x: 2, y: 0 },
  { id: 'b-advisor-1', side: 'black', type: PIECE_TYPE.ADVISOR, x: 3, y: 0 },
  { id: 'b-general', side: 'black', type: PIECE_TYPE.GENERAL, x: 4, y: 0 },
  { id: 'b-advisor-2', side: 'black', type: PIECE_TYPE.ADVISOR, x: 5, y: 0 },
  { id: 'b-elephant-2', side: 'black', type: PIECE_TYPE.ELEPHANT, x: 6, y: 0 },
  { id: 'b-knight-2', side: 'black', type: PIECE_TYPE.KNIGHT, x: 7, y: 0 },
  { id: 'b-rook-2', side: 'black', type: PIECE_TYPE.ROOK, x: 8, y: 0 },
  { id: 'b-cannon-1', side: 'black', type: PIECE_TYPE.CANNON, x: 1, y: 2 },
  { id: 'b-cannon-2', side: 'black', type: PIECE_TYPE.CANNON, x: 7, y: 2 },
  { id: 'b-soldier-1', side: 'black', type: PIECE_TYPE.SOLDIER, x: 0, y: 3 },
  { id: 'b-soldier-2', side: 'black', type: PIECE_TYPE.SOLDIER, x: 2, y: 3 },
  { id: 'b-soldier-3', side: 'black', type: PIECE_TYPE.SOLDIER, x: 4, y: 3 },
  { id: 'b-soldier-4', side: 'black', type: PIECE_TYPE.SOLDIER, x: 6, y: 3 },
  { id: 'b-soldier-5', side: 'black', type: PIECE_TYPE.SOLDIER, x: 8, y: 3 },

  // red
  { id: 'r-rook-1', side: 'red', type: PIECE_TYPE.ROOK, x: 0, y: 9 },
  { id: 'r-knight-1', side: 'red', type: PIECE_TYPE.KNIGHT, x: 1, y: 9 },
  { id: 'r-elephant-1', side: 'red', type: PIECE_TYPE.ELEPHANT, x: 2, y: 9 },
  { id: 'r-advisor-1', side: 'red', type: PIECE_TYPE.ADVISOR, x: 3, y: 9 },
  { id: 'r-general', side: 'red', type: PIECE_TYPE.GENERAL, x: 4, y: 9 },
  { id: 'r-advisor-2', side: 'red', type: PIECE_TYPE.ADVISOR, x: 5, y: 9 },
  { id: 'r-elephant-2', side: 'red', type: PIECE_TYPE.ELEPHANT, x: 6, y: 9 },
  { id: 'r-knight-2', side: 'red', type: PIECE_TYPE.KNIGHT, x: 7, y: 9 },
  { id: 'r-rook-2', side: 'red', type: PIECE_TYPE.ROOK, x: 8, y: 9 },
  { id: 'r-cannon-1', side: 'red', type: PIECE_TYPE.CANNON, x: 1, y: 7 },
  { id: 'r-cannon-2', side: 'red', type: PIECE_TYPE.CANNON, x: 7, y: 7 },
  { id: 'r-soldier-1', side: 'red', type: PIECE_TYPE.SOLDIER, x: 0, y: 6 },
  { id: 'r-soldier-2', side: 'red', type: PIECE_TYPE.SOLDIER, x: 2, y: 6 },
  { id: 'r-soldier-3', side: 'red', type: PIECE_TYPE.SOLDIER, x: 4, y: 6 },
  { id: 'r-soldier-4', side: 'red', type: PIECE_TYPE.SOLDIER, x: 6, y: 6 },
  { id: 'r-soldier-5', side: 'red', type: PIECE_TYPE.SOLDIER, x: 8, y: 6 }
];

export function cloneBoard(board) {
  return board.map((p) => ({ ...p }));
}

export function isInsideBoard(x, y) {
  return x >= 0 && x < BOARD_COLS && y >= 0 && y < BOARD_ROWS;
}
