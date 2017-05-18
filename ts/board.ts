import {Chessmen, Knight, King, Queen, Soldier, Castle, Bishop} from './chessmen'
import {Player, Position} from './game'

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


export interface onTurnOverCallBack{
    f: (board: Board) => any;
    once: boolean;
}

export class Board{

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

    public onTurnOver: onTurnOverCallBack[];

    private dom: HTMLElement;
    private board: Block[][];
    private chessmen: Chessmen[];
    public turn: Player;

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
        let pos = c.nextPosition(this.board, null);
        console.log('next position');
        console.log(pos);
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
                this.moveChess(sourceBlock, block);
                this.runCallbacks();
            }
        })
    }

    private moveChess(s :Block, d: Block){
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
}
