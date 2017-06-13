import {Player, Position} from './game'
import {isInBoard, hasChess, hasPlayerChess, counter, getUniqueControl, endline} from "./util"
import {Block, Board} from "./board"
import fs = require('fs');
import {remote} from 'electron'


/** 
 * Chessmen Class
 * 棋子类的抽象基类
 * 
 * @member protected svgRoot 存放svg棋子对应svg文件路径的字典,键值是 Player
 * @member  public owner: Player 棋子的主人
 * @member protected dom: HTMLElement 棋子svg对应的HTMLElement
 * @member   protected position: Position 棋子的当前位置
 * 
 * @method protected render(context: HTMLElement): void 向HTMLElement中渲染svg对象, 并初始化dom属性
 * @method abstract move(next: Position, board: Board): void 移动棋子到next位置,并执行移动带来的副作用.
 * @method abstract nextPostion(board: Board, now: Position): Position[] 获得棋子对于now位置的下一步可以移动的位置. 
 *      now 为 null 则使用棋子当前位置
 * @method abstract getControl(board: Board, now: Position): Position[] 获得棋子在now位置所控制的位置.
 *      now 为 null 则使用棋子当前位置
 * @method pos(): Position 获得棋子当前位置
*/
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
    abstract nextPosition(board: Board, now: Position): Position[]
    abstract getControl(board: Board, now: Position): Position[];
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


    public nextPosition(board: Board, now: Position): Position[]{

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
          if(isInBoard(e) && hasPlayerChess(board.board, e) !== this.owner) ret.push(e);
        });

        return ret;
    }

    public getControl(board: Board, now: Position): Position[] {
        return this.nextPosition(board, now);
    }

}

export class King extends Chessmen{

    private _moved: Boolean;

    public constructor(context: Block, player: Player) {
        super(context.pos, player);
        this._moved = false;
        context.chessman = this;
        this.svgRoot = {
            0: 'svg/king.svg',
            1: 'svg/blackKing.svg',
        }
        this.render(context.dom);
    }

    public get moved(): Boolean{
        return this._moved
    }

    public move(next: Position, board: Board): void {
        if(!this._moved) this._moved = true;
        if(Math.abs(next.y - this.position.y) <= 1){ 
            this.position = next; return; 
        }
        let castle = next.y > this.position.y ? {x: this.position.x, y: 7} : {x: this.position.x, y: 0}
        let next_king: Position; let next_castle: Position;
        if(next.y < this.position.y){
            next_castle = {x: this.position.x, y: this.position.y - 1};
        }else{
            next_castle = {x: this.position.x, y: this.position.y + 1};
        }
        board.moveChess(board.At(castle), board.At(next_castle));            
        this.position = next;
    }


    private _nextPosition(board: Board, now: Position, exchange: Boolean): Position[] {
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
          if(isInBoard(e) && hasPlayerChess(board.board, e) !== this.owner) ret.push(e);
        });
        if(exchange){
            let c = board.board[X][0].chessman;
            if(!this.moved && c instanceof Castle && !c.moved){
                let controled = getUniqueControl(board.forAllPlayer(counter(this.owner), c => c.getControl(board, null)))
                let blocked = false;
                controled.forEach(e => {
                    if(e.x === this.position.x && e.y <= this.position.y && e.y > c.pos().y) blocked = true;
                })
                for(var i = 1; i < this.position.y; ++i){
                    if(board.board[X][i].chessman !== null) blocked = true;
                }
                if(!blocked) ret.push({x: X, y: 1});
            }

            c = board.board[X][7].chessman;
            if(!this.moved && c instanceof Castle && !c.moved){
                let controled = getUniqueControl(board.forAllPlayer(counter(this.owner), c => c.getControl(board, null)))
                let blocked = false;
                controled.forEach(e => {
                    if(e.x === this.position.x && e.y >= this.position.y && e.y < c.pos().y) blocked = true;
                })
                console.log(blocked)
                for(var i = 6; i > this.position.y; --i){
                    if(board.board[X][i].chessman !== null) {
                        blocked = true;
                        console.log(`blocked at ${i}`)
                    }
                }
                if(!blocked) {
                    ret.push({x: X, y: 5});
                    console.log("castle ready")
                }
            }
        }
        return ret;
    }

    public nextPosition(board: Board, now: Position): Position[]{
        return this._nextPosition(board, now, true);
    }

    public getControl(board: Board, now: Position): Position[]{
        return this._nextPosition(board, now, false);
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
        let victim = this.findVictim(next, board);
        if(victim !== null){
            board.removeChess(victim)
        }
        this.position = next;
        if(this.position.x == endline(counter(this.owner)) 
            && !(board.At(this.position).chessman instanceof King)){
            this.showPrompt(board);
        }
    }

    public getControl(board: Board, now: Position): Position[]{
        if(now == null) now = this.position;
        let X = now.x; let Y = now.y;
        let all: Position[] = [];
        if(this.owner == Player.white){
            all.push({x: X+1, y: Y+1})
            all.push({x: X+1, y: Y-1})
        }else{
            all.push({x: X-1, y: Y+1})
            all.push({x: X-1, y: Y-1})
        }
        let ret: Position[] = [];
        all.forEach(e => {
            if(isInBoard(e) && hasPlayerChess(board.board, e) !== this.owner) ret.push(e)
        })
        return ret;
    }

    // 0 is white, 1 is black
    public nextPosition(board: Board, now: Position): Position[] {

        if(now == null) now = this.position;
        let X = now.x; let Y = now.y;

        let all: Position[] = [];

        if(this.owner == Player.white){
            if(this.isVictim({x: X, y: Y+1}, board) !== null) all.push({x: X+1, y: Y+1}) 
            if(this.isVictim({x: X, y: Y-1}, board) !== null) all.push({x: X+1, y: Y-1}) 
            if(!hasChess(board.board, {x: X+1, y: Y})) all.push({x: X+1, y: Y})
            if(hasChess(board.board, {x: X+1, y: Y+1})) all.push({x: X+1, y: Y+1})
            if(hasChess(board.board, {x: X+1, y: Y-1})) all.push({x: X+1, y: Y-1})
            if(!this.moved) {
                if(!hasChess(board.board, {x: X+2, y: Y})) all.push({x: X+2, y:Y});
            }
            
        }else{
            if(this.isVictim({x: X, y: Y+1}, board) !== null) all.push({x: X-1, y: Y+1}) 
            if(this.isVictim({x: X, y: Y-1}, board) !== null) all.push({x: X-1, y: Y-1}) 
            if(!hasChess(board.board, {x: X-1, y: Y})) all.push({x: X-1, y: Y})
            if(hasChess(board.board, {x: X-1, y: Y+1})) all.push({x: X-1, y: Y+1})
            if(hasChess(board.board, {x: X-1, y: Y-1})) all.push({x: X-1, y: Y-1})
            if(!this.moved) {
                if(!hasChess(board.board, {x: X-2, y: Y})) all.push({x: X-2, y:Y});
            }
        }

        let ret: Position[]= [];
        all.forEach(e => {
          if(isInBoard(e) && hasPlayerChess(board.board, e) !== this.owner) ret.push(e);
        });
        return ret;
    }

    private findVictim(next: Position, board: Board): Chessmen{
        if(next.x !== this.position.x && next.y !== this.position.y){
            let victim = this.owner === Player.white ? {x: next.x - 1, y: next.y} : {x: next.x + 1, y: next.y};
            return this.isVictim(victim, board);
            }else{
            return null;
        }
    }

    private isVictim(pos: Position, board: Board): Chessmen{
        if(!isInBoard(pos))return null;
        let chess = board.board[pos.x][pos.y].chessman;
        if(chess instanceof Soldier && chess.enpassable) return chess;
        return null;
    }

    private showPrompt(board: Board): void{
        let win = remote.getCurrentWindow();
        let re = remote.dialog.showMessageBox(win, {
            type: "question",
            buttons: ["queen", "knight", "bishop", "castle"],
            message: "选择要升变的棋子"
        })
        let res = [Queen, Knight, Bishop, Castle];
        board.onTurnOver.unshift({f: () => {
            board.removeChess(this);
            board.addChess(new res[re](board.At(this.position), this.owner))
        }, once: true})
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

    public nextPosition(board: Board, now: Position): Position[] {
        let P = now === null ? this.position : now;
        let X = P.x; let Y = P.y;
        let all: Position[] = [];

        for(let p = {x: X+1, y: Y}; isInBoard(p); p.x += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }

        for(let p = {x: X+1, y: Y}; isInBoard(p); p.x += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
 
        }

        for(let p = {x: X-1, y: Y}; isInBoard(p); p.x -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }

        for(let p = {x: X, y: Y+1}; isInBoard(p); p.y += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X, y: Y-1}; isInBoard(p); p.y -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X+1, y: Y+1}; isInBoard(p); p.x += 1, p.y += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X+1, y: Y-1}; isInBoard(p); p.x += 1, p.y -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y-1}; isInBoard(p); p.x -= 1, p.y -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y+1}; isInBoard(p); p.x -= 1, p.y += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }
        return all;
    }

    public getControl(board: Board, now: Position){
        return this.nextPosition(board, now);
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

    public nextPosition(board: Board, now: Position): Position[] {
        let P = now === null ? this.position : now;
        let X = P.x; let Y = P.y;
        let all: Position[] = [];

        for(let p = {x: X+1, y: Y+1}; isInBoard(p); p.x += 1, p.y += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X+1, y: Y-1}; isInBoard(p); p.x += 1, p.y -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y-1}; isInBoard(p); p.x -= 1, p.y -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y+1}; isInBoard(p); p.x -= 1, p.y += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});
        }
        return all;
    }

    public getControl(board: Board, now: Position){
        return this.nextPosition(board, now);
    }
}

export class Castle extends Chessmen{

    private _moved: boolean;

    public constructor(context: Block, player: Player){
        super(context.pos, player);
        this._moved = false;
        context.chessman = this;
        this.svgRoot = {
            0: 'svg/castle.svg',
            1: 'svg/blackCastle.svg',
        }
        this.render(context.dom);
    }

    public get moved(): Boolean{
        return this._moved;
    }

    public move(next: Position, board: Board): void {
        this.position = next;
    }

    public nextPosition(board: Board, now: Position): Position[]{
        return this._nextPosition(board, now, true);
    }

    public getControl(board: Board, now: Position): Position[]{
        return this._nextPosition(board, now, false);
    }

    private _nextPosition(board: Board, now: Position, exchange: Boolean): Position[] {
        let P = now === null ? this.position : now;
        let X = P.x; let Y = P.y;
        let all: Position[] = [];

        for(let p = {x: X+1, y: Y}; isInBoard(p); p.x += 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X-1, y: Y}; isInBoard(p); p.x -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X, y: Y-1}; isInBoard(p); p.y -= 1){
            let c = hasPlayerChess(board.board, p);
            if(c == this.owner) break;
            else if(c == counter(this.owner) ){
                all.push({x: p.x, y: p.y})
                break;
            }
            all.push({x: p.x, y: p.y});

        }

        for(let p = {x: X, y: Y+1}; isInBoard(p); p.y += 1){
            let c = hasPlayerChess(board.board, p);
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