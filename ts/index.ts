import {Board} from "./board"
import {Player} from "./game"
import {Arbiter} from "./arbiter"


/**
 * function main(): [Board, Arbiter] 主页面主函数 
 *      创建棋盘和裁判对象并开始棋局,返回创建的对象,方便进行调试
 */
export function main(): [Board, Arbiter]{
    let board = new Board(document.getElementById("mainBoard"));
    let arbiter = new Arbiter(board);
    arbiter.startGame();

    return [board, arbiter];
}
