import {Player, Position} from './game'
import {isInBoard, hasChess, hasPlayerChess, counter} from "./util"
import {Block, Board} from "./board"
import fs = require('fs');


export abstract class Chessmen{

    protected svgRoot:{[index: number]: string} = {0: null, 1: null};

    public constructor(now: Position, player: Player){
        this.position = now;
        this.owner = player;        
    }

    
    protected render(context: HTMLElement){
        let index: number = (this.owner == Player.white) ? 0 : 1;
        let content = fs.readFileSync(this.svgRoot[index], 'utf-8');
        context.innerHTML = content;        
        this.dom = <HTMLElement>context.firstChild;
    }

    abstract move(next: Position, board: Board): void;
    abstract nextPosition(board: Block[][], now: Position): Position[];
    protected position: Position;

    public pos(): Position{return this.position;}
    public owner: Player;
    public dom: HTMLElement;
}

export class Knight extends Chessmen{

    public constructor(context: Block, player: Player){
        super(context.pos, player);
        context.chessman = this;
        this.svgRoot = {
            0: 'svg/knight.svg',
            1: 'svg/blackKnight.svg',
        }
        this.render(context.dom);
    }


    public move(next: Position, board: Board): void {
        this.position = next;
    }


    public nextPosition(board: Block[][], now: Position): Position[]{

        if(now == null) now = this.position;
        let X = now.x; let Y = now.y;

        let all = [
            {x: X+1, y: Y+2},
            {x: X+2, y: Y+1},
            {x: X+2, y: Y-1},
            {x: X+1, y: Y-2},
            {x: X-1, y: Y-2},
            {x: X-2, y: Y-1},
            {x: X-2, y: Y+1},
            {x: X-1, y: Y+2},
        ]
        let ret: Position[]= [];

        all.forEach(e => {
          if(isInBoard(e) && hasPlayerChess(board, e) !== this.owner) ret.push(e);
        });

        return ret;
    }
}

export class King extends Chessmen{

    public constructor(context: Block, player: Player) {
        super(context.pos, player);
        context.chessman = this;
        this.svgRoot = {
            0: 'svg/king.svg',
            1: 'svg/blackKing.svg',
        }
        this.render(context.dom);
    }


    public move(next: Position, board: Board): void {
        this.position = next;
    }


    public nextPosition(board: Block[][], now: Position): Position[] {
        if(now == null) now = this.position;
        let X = now.x; let Y = now.y;

        let all = [
            {x: X, y: Y+1},
            {x: X+1, y: Y+1},
            {x: X+1, y: Y},
            {x: X+1, y: Y-1},
            {x: X, y: Y-1},
            {x: X-1, y: Y-1},
            {x: X-1, y: Y},
            {x: X-1, y: Y+1},
        ]

        let ret: Position[]= [];
        all.forEach(e => {
          if(isInBoard(e) && hasPlayerChess(board, e) !== this.owner) ret.push(e);
        });
        return ret;
    }
}



export class Soldier extends Chessmen{

    private moved: boolean;
    private enpassable: boolean;
   
    public constructor(context: Block, player: Player){
        super(context.pos, player);
        context.chessman = this;
        this.moved = false;
        this.enpassable = false;
        this.svgRoot = {
            0: 'svg/soldier.svg',
            1: 'svg/blackSoldier.svg',
        }
        this.render(context.dom);
    }

    public move(next: Position, board: Board): void {
        if(this.moved == false){
            this.moved = true;
            this.enpassable = true;
            let removeMarker: (board: Board)=>(void) = (board) => {
                let re: (board: Board)=>(void) = (board) => {
                    this.enpassable = false;
                }
                board.onTurnOver.push({f: re, once: true})
            }
            board.onTurnOver.push({f: removeMarker, once: true})    
        }
        let victim = this.findVictim(next, board.board);
        if(victim !== null){
            board.removeChess(victim)
        }
        this.position = next;
    }


    // 0 is white, 1 is black
    public nextPosition(board: Block[][], now: Position): Position[] {

        if(now == null) now = this.position;
        let X = now.x; let Y = now.y;

        let all: Position[] = [];

        if(this.owner == Player.white){
            if(this.isVictim({x: X, y: Y+1}, board) !== null) all.push({x: X+1, y: Y+1}) 
            if(this.isVictim({x: X, y: Y-1}, board) !== null) all.push({x: X+1, y: Y-1}) 
            if(!hasChess(board, {x: X+1, y: Y})) all.push({x: X+1, y: Y})
            if(hasChess(board, {x: X+1, y: Y+1})) all.push({x: X+1, y: Y+1})
            if(hasChess(board, {x: X+1, y: Y-1})) all.push({x: X+1, y: Y-1})
            if(!this.moved) {
                all.push({x: X+2, y:Y})
            }
            
        }else{
            if(this.isVictim({x: X, y: Y+1}, board) !== null) all.push({x: X-1, y: Y+1}) 
            if(this.isVictim({x: X, y: Y-1}, board) !== null) all.push({x: X-1, y: Y-1}) 
            if(!hasChess(board, {x: X-1, y: Y})) all.push({x: X-1, y: Y})
            if(hasChess(board, {x: X-1, y: Y+1})) all.push({x: X-1, y: Y+1})
            if(hasChess(board, {x: X-1, y: Y-1})) all.push({x: X-1, y: Y-1})
            if(!this.moved) {
                all.push({x: X-2, y:Y})
            }
        }

        let ret: Position[]= [];
        all.forEach(e => {
          if(isInBoard(e) && hasPlayerChess(board, e) !== this.owner) ret.push(e);
        });
        return ret;
    }

    private findVictim(next: Position, board: Block[][]): Chessmen{
        if(next.x !== this.position.x && next.y !== this.position.y){
            let victim = this.owner === Player.white ? {x: next.x - 1, y: next.y} : {x: next.x + 1, y: next.y};
            return this.isVictim(victim, board);
            }else{
            return null;
        }
    }

    private isVictim(pos: Position, board: Block[][]): Chessmen{
        if(!isInBoard(pos))return null;
        let chess = board[pos.x][pos.y].chessman;
        if(chess instanceof Soldier && chess.enpassable) return chess;
        return null;
    }

}

export class Queen extends Chessmen{

    public constructor(context: Block, player: Player){
        super(context.pos, player);
        context.chessman = this;
        this.svgRoot = {
            0: 'svg/queen.svg',
            1: 'svg/blackQueen.svg',
        }
        this.render(context.dom);
    }

    public move(next: Position, board: Board): void {
        this.position = next;
    }

    public nextPosition(board: Block[][], now: Position): Position[] {
        let P = now === null ? this.position : now;
        let X = P.x; let Y = P.y;
        let all: Position[] = [];

        for(let p = {x: X+1, y: Y}; isInBoard(p); p.x += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }

        for(let p = {x: X+1, y: Y}; isInBoard(p); p.x += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
 
        }

        for(let p = {x: X-1, y: Y}; isInBoard(p); p.x -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }

        for(let p = {x: X, y: Y+1}; isInBoard(p); p.y += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X, y: Y-1}; isInBoard(p); p.y -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X+1, y: Y+1}; isInBoard(p); p.x += 1, p.y += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X+1, y: Y-1}; isInBoard(p); p.x += 1, p.y -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y-1}; isInBoard(p); p.x -= 1, p.y -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y+1}; isInBoard(p); p.x -= 1, p.y += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }
        return all;
    }

}

export class Bishop extends Chessmen{

    public constructor(context: Block, player: Player){
        super(context.pos, player);
        context.chessman = this;
        this.svgRoot = {
            0: 'svg/bishop.svg',
            1: 'svg/blackBishop.svg',
        }
        this.render(context.dom);
    }

    public move(next: Position, board: Board): void {
        this.position = next;
    }

    public nextPosition(board: Block[][], now: Position): Position[] {
        let P = now === null ? this.position : now;
        let X = P.x; let Y = P.y;
        let all: Position[] = [];

        for(let p = {x: X+1, y: Y+1}; isInBoard(p); p.x += 1, p.y += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X+1, y: Y-1}; isInBoard(p); p.x += 1, p.y -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y-1}; isInBoard(p); p.x -= 1, p.y -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y+1}; isInBoard(p); p.x -= 1, p.y += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }
        return all;
    }


}

export class Castle extends Chessmen{

    public constructor(context: Block, player: Player){
        super(context.pos, player);
        context.chessman = this;
        this.svgRoot = {
            0: 'svg/castle.svg',
            1: 'svg/blackCastle.svg',
        }
        this.render(context.dom);
    }

    public move(next: Position, board: Board): void {
        this.position = next;
    }

    public nextPosition(board: Block[][], now: Position): Position[] {
        let P = now === null ? this.position : now;
        let X = P.x; let Y = P.y;
        let all: Position[] = [];

        for(let p = {x: X+1, y: Y}; isInBoard(p); p.x += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y}; isInBoard(p); p.x -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X, y: Y-1}; isInBoard(p); p.y -= 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X, y: Y+1}; isInBoard(p); p.y += 1){
            let c = hasPlayerChess(board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }
        return all;
    }

}