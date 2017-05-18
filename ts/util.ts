import {Player, Position} from "./game"
import {Block} from "./board"

export function isInBoard(pos: Position){
    return pos.x < 8 && pos.x >= 0 && pos.y < 8 && pos.y >= 0
}

export function hasChess(board: Block[][], pos: Position): Boolean{
    if(! isInBoard(pos)) return false;
    return board[pos.x][pos.y].chessman !== null;
}

export function hasPlayerChess(board: Block[][], pos: Position): Player{
    if(! isInBoard(pos)) return null;
    let chess = board[pos.x][pos.y].chessman;
    if(chess === null) return null;
    else return chess.owner;
}

export function counter(player: Player): Player{
    return player === Player.white ? Player.black : Player.white;
}