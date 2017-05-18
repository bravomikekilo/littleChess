import {Board} from "./board"
import {Player} from "./game"
import {Arbiter} from "./arbiter"


export function main(): [Board, Arbiter]{
    let board = new Board(document.getElementById("mainBoard"));
    let arbiter = new Arbiter(board);
    arbiter.startGame();

    return [board, arbiter];
}
