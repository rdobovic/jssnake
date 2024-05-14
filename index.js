const SNAKE_COLOR = '#4E9F3D';

class SnakeBoard {
    constructor(ctx, rows, cols, gap) {
        this.ctx = ctx;
        this.rows = rows;
        this.cols = cols;
        this.fieldGap = gap;

        this.fieldWidth = ctx.canvas.clientWidth;
        this.fieldHeight = ctx.canvas.clientHeight;

        this.boxSize = Math.floor((this.fieldWidth / cols) - (gap * 2));
    }

    // Returns coordinate of top left corner of the box
    posToCor(pos) {
        return this.fieldGap + (pos * (this.fieldGap * 2 + this.boxSize));
    }

    drawBox(col, row) {
        this.ctx.fillStyle = SNAKE_COLOR;
        this.ctx.fillRect(
            this.posToCor(col), this.posToCor(row),
            this.boxSize, this.boxSize
        );
    }

    drawHead(col, row, dir) {
        this.ctx.beginPath();
        this.ctx.fillStyle = SNAKE_COLOR;

        const w = this.boxSize;
        const x = this.posToCor(col), y = this.posToCor(row);

        switch(dir) {
            case "u":
                this.ctx.moveTo(x + w / 2, y);
                this.ctx.lineTo(x, y + w);
                this.ctx.lineTo(x + w, y + w);
                this.ctx.fill();
                break;
            case "l":
                this.ctx.moveTo(x, y + w / 2);
                this.ctx.lineTo(x + w, y + w);
                this.ctx.lineTo(x + w, y);
                this.ctx.fill();
                break;
            case "d":
                this.ctx.moveTo(x + w / 2, y + w);
                this.ctx.lineTo(x, y);
                this.ctx.lineTo(x + w, y);
                this.ctx.fill();
                break;
            case "r":
                this.ctx.moveTo(x + w, y + w / 2);
                this.ctx.lineTo(x, y);
                this.ctx.lineTo(x, y + w);
                this.ctx.fill();
                break;
        }
    }

    drawFruit(col, row) {
        this.ctx.beginPath();
        this.ctx.fillStyle = "#f5a142";

        const w = this.boxSize;
        const x = this.posToCor(col), y = this.posToCor(row);
        
        this.ctx.arc(x + w / 2, y + w / 2, w / 2, 0, Math.PI * 2, true);
        this.ctx.fill();
    }

    clear() {
        this.ctx.clearRect(0, 0,
            this.cols * (this.boxSize + (2 * this.fieldGap)),
            this.rows * (this.boxSize + (2 * this.fieldGap))
        );
    }
}

//const snakeDirections = [ 'u', 'd', 'l', 'r' ];

const buttonToDirection = {
    'ArrowUp':    'u',
    'ArrowDown':  'd',
    'ArrowLeft':  'l',
    'ArrowRight': 'r',
}

const snakeStepTime = 150;

class Snake {
    constructor(board, gameOverCb, scoreCb) {
        this.board = board;
        this.interval = null;
        this.scoreCb = scoreCb;
        this.gameOverCb = gameOverCb;

        this.reset();
    }

    reset() {
        const centerRow = Math.floor(this.board.rows / 2);

        this.score = 0;
        this.parts = [];
        this.commandToExecute = null;

        this.parts.push({
            col: 5,
            row: centerRow,
            dir: 'r',
        });

        this.fruit = {
            col: 3,
            row: centerRow,
        };

        this.scoreCb(this);
    }

    start() {
        this.interval = setInterval(() => {
            let i;

            if (this.commandToExecute) {
                this.parts[0].dir = this.commandToExecute;
            }

            const nextPos = {
                col: this.parts[this.parts.length - 1].col,
                row: this.parts[this.parts.length - 1].row,
            }

            for (i = this.parts.length - 1; i > 0; i--) {
                this.parts[i].col = this.parts[i - 1].col;
                this.parts[i].row = this.parts[i - 1].row;
            }

            const head = this.parts[0];

            switch (head.dir) {
                case 'u':
                    --head.row
                    break;
                case 'd':
                    ++head.row
                    break;
                case 'l':
                    --head.col
                    break;
                case 'r':
                    ++head.col
                    break;
            }

            if (
                head.row < 0 || head.row >= this.board.rows || 
                head.col < 0 || head.col >= this.board.cols ||
                this.parts.slice(1).find(part => part.col == head.col && part.row == head.row)
            ) {
                this.gameOverCb(this);
                this.stop();
            }

            if (this.fruit.row == head.row && this.fruit.col == head.col) {
                ++this.score;
                do {
                    this.fruit.col = Math.floor(Math.random() * this.board.cols);
                    this.fruit.row = Math.floor(Math.random() * this.board.rows);
                } while (this.parts.find((part) => 
                    part.row == this.fruit.row && part.col == this.fruit.col));

                this.parts.push({
                    col: nextPos.col,
                    row: nextPos.row,
                });

                this.scoreCb(this);
            }

            this.board.clear();
            this.board.drawHead(head.col, head.row, head.dir);
            this.board.drawFruit(this.fruit.col, this.fruit.row);

            for (i = 1; i < this.parts.length; i++) {
                const part = this.parts[i];
                this.board.drawBox(part.col, part.row);
            }
        }, snakeStepTime);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    isRunning() {
        return !!this.interval;
    }

    command(cmd) {
        if (!this.isRunning())
            return;
        
        if (Object.keys(buttonToDirection).includes(cmd)) {
            const dir = this.parts[0].dir;
            const newDir = buttonToDirection[cmd];

            if (
                (dir == 'u' && newDir == 'd') ||
                (dir == 'd' && newDir == 'u') ||
                (dir == 'l' && newDir == 'r') ||
                (dir == 'r' && newDir == 'l')
            )
                return;
            
            this.commandToExecute = newDir;
        }
    }
}

const snakeList = [];

window.onload = () => {

    const score = document.getElementById('score');
    const canvas = document.getElementById('field');
    const ctx = canvas.getContext('2d');
    const paused = document.getElementById('paused');
    const gameOver = document.getElementById('gameover');

    let dead = false;

    const scoreCb = (snake) => {
        score.innerText = snake.score * 50;
    }

    const gameOverCb = (snake) => {
        dead = true;
        gameOver.style.display = "block";
    }

    const snakeBoard = new SnakeBoard(ctx, 20, 30, 1);
    const snake = new Snake(snakeBoard, gameOverCb, scoreCb);

    document.addEventListener('keydown', (e) => {
        if (e.key == 'r') {
            dead = false;
            snake.stop();
            snake.reset();
            snake.start();
            gameOver.style.display = "none";
        }

        if (dead) return;

        if (e.key == 'p') {
            if (snake.isRunning()) {
                snake.stop();
                paused.style.display ="block";
            } else {
                snake.start();
                paused.style.display ="none";
            }
        }

        snake.command(e.key);
    });

    snake.start();

    //setTimeout(() => snake.stop(), snakeStepTime);

//    while (true) {

//    }
}

