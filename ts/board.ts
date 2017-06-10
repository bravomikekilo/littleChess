import {Chessmen, Knight, King, Queen, Soldier, Castle, Bishop} from './chessmen'
import {Player, Position} from './game'
import {getUniqueControl, counter} from "./util"

/**
 * Block 类 棋盘格类
 * 属性
 * public pos: Postion 棋盘格对应的位置
 * public dom: HTMLElement 棋盘格的HTMLElement
 * public chessman: Chessmen 棋盘格上放着的棋子
 * 方法
 * public hasPlayerChess(player: Player): boolean 检查棋盘格上是否有属于player的棋子
 * public hasChess(): boolean 检查棋盘格上是否有棋子
 * public putChess(svg: string): HTMLElement 在棋盘格上渲染svg并返回svg对象
 * public removeChess(): HTMLElement 剪切棋盘格上的svg对象并返回
 * public changeChess(svg: HTMLElement): void 更换棋盘格中的svg对象
 * public greenRound(): void 将棋盘格的边缘变成绿色
 * public redRound(): void 将棋盘格的边缘变成红色
 * public setAlert(): void 将棋盘格的背景色变成红的.
 * public cleanAlert(): void 清除棋盘格的背景
 * public cleanRound(): void 清除棋盘格的边缘
 */
export class Block{
    public pos: Position;
    public dom: HTMLElement;
    public chessman: Chessmen;

    public hasPlayerChess(player :Player): boolean{
        return this.chessman !== null && this.chessman.owner == player;
    }


    public hasChess(): boolean{
        return this.chessman !== null;
    }

    public putChess(svg: string): HTMLElement{
        this.dom.innerHTML = svg;
        return <HTMLElement>this.dom.firstChild;
    }

    public removeChess(): HTMLElement{
        let html = this.dom.innerHTML;
        this.dom.innerHTML = "";
        let ret = document.createElement('div');
        ret.innerHTML = html;
        return ret;
    }

    public changeChess(svg: HTMLElement): void{
        this.dom = svg;
    }
    

    public greenRound(): void{
        this.dom.classList.remove('sichess-board-block-normal');
        this.dom.classList.add('chess-board-block-next');
    }

    public redRound(): void{
        this.dom.classList.remove('chess-board-block-normal');
        this.dom.classList.add('chess-board-block-enemy');
    }

    public setAlert(): void{
        this.dom.classList.add('chess-board-block-alert');
    }

    public cleanAlert(): void{
        this.dom.classList.remove('chess-board-block-alert');
    }

    public cleanRound(): void{
        this.dom.classList.remove('chess-board-block-next');
        this.dom.classList.remove('chess-board-block-enemy');
        this.dom.classList.add('chess-board-block-normal');
    }

    public constructor(white: boolean, root: HTMLElement, pos: Position){
        this.chessman = null;
        this.dom = root;
        this.pos = pos;
        this.dom.classList.add('chess-board-block')
        this.dom.classList.add('chess-board-block-normal');
        if(white)this.dom.classList.add('chess-board-block-white');
        else this.dom.classList.add('chess-board-block-black');
    }
}

/**
 * onTurnOverCallBack 回合结束回调函数
 * f: (board: Board) => any 实际的回调函数.
 * once: boolean 是否调用一次回调函数后就将其销毁.
 */

export interface onTurnOverCallBack{
    f: (board: Board) => any;
    once: boolean;
}

export class Board{

    public onTurnOver: onTurnOverCallBack[];
    public turn: Player;
    public board: Block[][];

    private dom: HTMLElement;
    private chessmen: Chessmen[];


    public constructor(root: HTMLElement){
        this.dom = root;
        this.board = [];
        this.chessmen = [];
        this.onTurnOver = [];
        root.classList.add('chess-board')
        for(var i = 0; i < 8; i += 1){
            let row = document.createElement('div');
            row.classList.add('chess-board-row');
            root.appendChild(row);
            this.board[i] = []
            for(var j = 0; j < 8; j += 1){
                let block = document.createElement('div');
                row.appendChild(block);
                this.board[i][j] = new Block((i+j) % 2 == 0, block, {x: i, y: j});
            }
        }
    }

    public isKindAlive(player: Player): Boolean{
        let alive = false;
        this.chessmen.forEach((e) => {
            if(e instanceof King && e.owner == player) alive = true;
        })
        return alive;
    }

    private setBottom(row: number, p: Player): void {
            this.chessmen.push(new Castle(this.board[row][0], p));
            this.chessmen.push(new Castle(this.board[row][7], p));
            this.chessmen.push(new Knight(this.board[row][1], p));
            this.chessmen.push(new Knight(this.board[row][6], p));
            this.chessmen.push(new Bishop(this.board[row][2], p));
            this.chessmen.push(new Bishop(this.board[row][5], p));
            this.chessmen.push(new King(this.board[row][3], p));
            this.chessmen.push(new Queen(this.board[row][4], p));
        }
        
    private setSolider(row: number, p: Player): void{
            for(let i = 0; i < 8; ++i){
                this.chessmen.push(new Soldier(this.board[row][i], p));
            }
        }


    public standardStart(): boolean{
        this.setBottom(0, Player.white);
        this.setSolider(1, Player.white);
        this.setBottom(7, Player.black);
        this.setSolider(6, Player.black);
        return true;
    }

    private runCallbacks(): void{
        let cs = this.onTurnOver.slice();
        let c = cs.shift();
        let o = this.onTurnOver.shift();
        for(;; c = cs.shift(), o = this.onTurnOver.shift()){
            c.f(this);
            if(!c.once) this.onTurnOver.push(o);
            if(cs.length == 0) break;
        }
    }

    public At(pos: Position){
        return this.board[pos.x][pos.y];
    }

    public runTurn(player: Player): void{
        this.turn = player;
        this.waitForSelectChess(player); 
    }

    private waitForSelectChess(player: Player) {
        this.chessmen.forEach(c => {
            if(c.owner == player){
                c.dom.onclick = (ev) => {
                    console.log('chess Selected');
                    c.dom.onclick = null;
                    this.waitForSelectMove(c);      
                }
            }
        })
    }

    private waitForSelectMove(c :Chessmen){
        console.log('wait for select move')
        this.chessmen.forEach(c => {
            c.dom.onclick = null;
        })
        let pos = c.nextPosition(this, null);
        console.log('next position');
        console.log(pos);
        if(pos.length === 0){
            console.log("can not move this chess !!")
            this.waitForSelectChess(this.turn)
            return
        }
        let con = getUniqueControl(this.forAllPlayer(counter(this.turn), c=>c.getControl(this, null)))
        con.forEach(p => {
            this.board[p.x][p.y].setAlert()
        })
        pos.forEach(p => {
            let block = this.board[p.x][p.y];
            block.greenRound();
            let s = c.pos();
            let sourceBlock = this.board[s.x][s.y]
            block.dom.onclick = () => {
                pos.forEach(p => {
                    this.board[p.x][p.y].dom.onclick = null;
                    this.board[p.x][p.y].cleanRound()
                })
                con.forEach(e => this.board[e.x][e.y].cleanAlert());
                this.moveChess(sourceBlock, block);
                this.runCallbacks();
            }
        })
    }

    public removeChess(c: Chessmen): string{
        for(let i = 0; i < this.chessmen.length; ++i){
            if(this.chessmen[i].pos() == c.pos()){
                console.log('remove chessmen')
                console.log(this.chessmen[i]);
                this.chessmen.splice(i, 1);
                break;
            }
        }
        let ele = this.At(c.pos()).dom;
        let ret = ele.innerHTML;
        ele.innerHTML = "";
        return ret;
    }

    public moveChess(s :Block, d: Block){
        let content = s.dom.innerHTML;
        let chess = d.chessman;
        s.dom.innerHTML = "";
        if(chess != null){
            for(let i = 0; i < this.chessmen.length; ++i){
                if(this.chessmen[i].pos() == chess.pos()){
                    console.log('remove chessmen')
                    console.log(this.chessmen[i]);
                    this.chessmen.splice(i, 1);
                    break;
                }
            }
            s.chessman.move(d.pos, this);
            d.dom.innerHTML = content;
            s.chessman.dom = <HTMLElement>d.dom.firstChild;
            d.chessman = s.chessman; s.chessman = null;
        }else{
            s.chessman.move(d.pos, this);
            d.dom.innerHTML = content;
            s.chessman.dom = <HTMLElement>d.dom.firstChild;
            d.chessman = s.chessman; s.chessman = null;
        }
    }

    public forAll<T>(f: (c: Chessmen) => T[]): T[]{
        let ret: T[] = [];
        this.chessmen.forEach(e => ret.concat(f(e)) )
        return ret; 
    }

    public forAllPlayer<T>(player: Player,f: (c: Chessmen) => T[]): T[]{
        let ret: T[] = [];
        this.chessmen.forEach(e => {
            if(e.owner == player) ret = ret.concat(f(e));
        })
        return ret;
    }

}
