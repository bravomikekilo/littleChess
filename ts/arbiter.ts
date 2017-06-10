import {Board} from "./board"
import {King} from "./chessmen"
import {Player} from "./game"

/**
 * Class Arbiter 裁判
 * 属性
 * private board: Board
 * 方法
 * public constructor(board: Board) 构造函数 board -> this.board
 * public startGame(): void 开始棋局
 */
export class Arbiter{
    private board: Board;
    
    public startGame(): void{
        this.board.standardStart();
        let runNextTurn:(board: Board)=>void = (board) => {
            console.log('Turn Over')
            let turn = board.turn == Player.white ? Player.black : Player.white;
            if(!board.isKingAlive(turn)){
                alert(`${turn == Player.white ? "black" : "white"} Player win`)
            }
            this.board.runTurn(turn);
        }
        this.board.onTurnOver.push({f: runNextTurn, once: false})
        this.board.runTurn(Player.white);
    }

    public constructor(board: Board){
        this.board = board;
    }    
}