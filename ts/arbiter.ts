import {Board} from "./board"
import {King} from "./chessmen"
import {Player} from "./game"

export class Arbiter{
    private board: Board;
    
    public startGame(): void{
        this.board.standardStart();
        let runNextTurn:(board: Board)=>void = (board) => {
            console.log('Turn Over')
            let turn = board.turn == Player.white ? Player.black : Player.white;
            if(!board.isKindAlive(turn)){
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