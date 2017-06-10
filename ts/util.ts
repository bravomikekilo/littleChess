/**
 * util.ts
 * 本文件包含实用函数
 */

import {Player, Position} from "./game"
import {Block} from "./board"
import {Chessmen} from "./chessmen"

/**
 * 查询位置是否在棋盘内
 * @param pos 位置
 */
export function isInBoard(pos: Position){
    return pos.x < 8 && pos.x >= 0 && pos.y < 8 && pos.y >= 0
}

/**
 * 查询棋盘格的二维数组的某个位置是否有棋子
 * @param board 棋盘格的二维数组
 * @param pos 查询的位置
 */
export function hasChess(board: Block[][], pos: Position): Boolean{
    if(! isInBoard(pos)) return false;
    return board[pos.x][pos.y].chessman !== null;
}

/**
 * 查询棋盘格的二维数组的某个位置是否有棋子, 返回玩家枚举, 无棋子返回null
 * @param board 棋盘格的二维数组
 * @param pos 查询的位置
 */
export function hasPlayerChess(board: Block[][], pos: Position): Player{
    if(!isInBoard(pos)) return null;
    let chess = board[pos.x][pos.y].chessman;
    if(chess === null) return null;
    else return chess.owner;
}

/**
 * 返回玩家的对手
 * @param player 玩家
 */
export function counter(player: Player): Player{
    return player === Player.white ? Player.black : Player.white;
}

/**
 * 清理重复的控制位置
 * @param pos 控制位置数组
 */
export function getUniqueControl(pos: Position[]): Position[]{
    pos.sort((r, l) => {
        if(r.x !== l.x) return r.x - l.x;
        return r.y - l.y
    })
    let ret: Position[] = []
    let last: Position;
    last = pos.shift();
    ret.push(last)
    pos.forEach(e => {
        if(e.x !== last.x || e.y !== last.y){ last = e; ret.push(last); }
    })
    return ret;
}