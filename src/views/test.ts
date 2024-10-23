import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

import { Container, Graphics, Text } from "pixi.js";
import { LibContainerSize } from "../ui/LibContainerSize";

/** @description A* 算法的实现 */
export class AStarPathfinding extends Container {
  /** 创建一个二维数组，存储每个点 */
  private board: Spot[][] = [];
  /** 存储待检查的网格 */
  private openSet: Spot[] = [];
  /** 存储已检查的网格 */
  private closedSet: Spot[] = [];
  /** 网格宽度 */
  private gridWidth = 30;
  /** 网格高度 */
  private gridHeight = 30;
  /** 起始网格 */
  private start!: Spot;
  /** 结束网格 */
  private end!: Spot;
  /** 存储找到的路径 */
  private path: Spot[] = [];
  /** 当前检查的网格，也就是最优网格 */
  private current!: Spot;
  /** 用于绘图的Graphics对象 */
  private graphics: Graphics;
  /** 用于表示移动方块的Graphics对象 */
  private square: LibContainerSize;

  constructor() {
    super();
    this.graphics = new Graphics(); //初始化绘图对象
    this.addChild(this.graphics); //将绘图对象添加到容器中
    this.initBoard(); //初始化网格
    this.addNeighbours(); //为每个点添加邻居
    this.findPath(); //执行路径寻找算法
    this.drawSquare();
    this.moveSquareAlongPath(); //移动方块沿着路径
  }

  /** @description 初始化网格 */
  private initBoard() {
    //循环创建网格
    for (let x = 0; x < this.gridWidth; x++) {
      this.board.push([]);
      for (let y = 0; y < this.gridHeight; y++) {
        this.board[x][y] = new Spot(x, y);
      }
    }

    //设置起止点
    this.start = this.board[0][0];
    this.end = this.board[this.gridWidth - 1][this.gridHeight - 1];

    //确保起止点不是障碍物
    this.start.isObstacle = false;
    this.end.isObstacle = false;

    //定义不规则障碍物
    this.createIrregularObstacles(); //创建不规则障碍物
    this.openSet.push(this.start); //将起始点添加到待检查点

    //更新并绘制网格
    this.board.forEach((row) => row.forEach((tile) => this.drawTile(tile))); //绘制每个点
  }

  /** @description 设置不规则障碍物 */
  private createIrregularObstacles() {
    const irregularShapes = [
      [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 },
        { x: 7, y: 4 },
        { x: 7, y: 5 },
        { x: 8, y: 5 },
      ],
      [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 11, y: 11 },
        { x: 10, y: 12 },
        { x: 9, y: 11 },
      ],
      [
        { x: 15, y: 15 },
        { x: 16, y: 15 },
        { x: 16, y: 16 },
        { x: 17, y: 15 },
        { x: 17, y: 16 },
        { x: 16, y: 17 },
        { x: 15, y: 17 },
      ],
      [
        { x: 20, y: 25 },
        { x: 21, y: 24 },
        { x: 22, y: 25 },
        { x: 21, y: 26 },
      ],
      [
        { x: 25, y: 10 },
        { x: 26, y: 11 },
        { x: 26, y: 10 },
        { x: 27, y: 10 },
        { x: 27, y: 11 },
        { x: 28, y: 12 },
      ],
    ];

    //循环设置指定坐标的格子为障碍物
    for (const shape of irregularShapes) {
      shape.forEach((point) => {
        const spot = this.getTileAtPos(point.x, point.y);
        if (spot) {
          spot.isObstacle = true;
        }
      });
    }
  }

  /** @description 为每个格子设置相邻的8个邻居 */
  private addNeighbours() {
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const spot = this.board[x][y];
        this.addNeighbour(spot, x - 1, y);
        this.addNeighbour(spot, x + 1, y);
        this.addNeighbour(spot, x, y - 1);
        this.addNeighbour(spot, x, y + 1);
        this.addDiagonalNeighbours(spot, x, y);
      }
    }
  }

  /** @description 为指定网格添加指定坐标的网格作为邻居 */
  private addNeighbour(spot: Spot, x: number, y: number) {
    let neighbour = this.getTileAtPos(x, y);

    //邻居不能为障碍物
    if (neighbour && !neighbour.isObstacle) {
      spot.neighbours.push(neighbour);
    }
  }

  /** @description 添加对角邻居
   * @param spot 要添加邻居的网格
   * @param x 要添加邻居的网格的坐标
   * @param y 要添加邻居的网格的坐标
   */
  private addDiagonalNeighbours(spot: Spot, x: number, y: number) {
    const diagonals = [
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
      [x + 1, y + 1],
    ];

    for (const [dx, dy] of diagonals) {
      const diagonalSpot = this.getTileAtPos(dx, dy);
      if (
        diagonalSpot &&
        !diagonalSpot.isObstacle &&
        !this.isBlockedInDiagonal(x, y, dx, dy)
      ) {
        spot.neighbours.push(diagonalSpot); //将对角邻居添加到当前点
      }
    }
  }

  /** @description 寻找路径 */
  private findPath() {
    while (true) {
      //设置当前最优网格的索引
      let winner = 0;

      //从待检查网格中找到总成本比当前最优点少的网格
      for (let i = 0; i < this.openSet.length; i++) {
        if (this.openSet[i].totalCost < this.openSet[winner].totalCost) {
          winner = i;
        }
      }

      //存储最优网格
      this.current = this.openSet[winner];

      //如果当前点是结束点，说明已找到最佳路径
      if (this.current === this.end) {
        this.path = []; //重置网格路径
        let temp = this.current; //从当前点开始回溯

        //开始从终点追溯到起点，将循环将上一个路径点添加到路径中，直到temp没有上一个点为止，即起点
        while (temp) {
          this.path.push(temp);
          temp = temp.previous!;
        }

        //由于是追溯，所以路径是反向的，需要反转
        this.path.reverse();
        break;
      }

      //存储已检查的点
      this.closedSet.push(this.current);
      //从待检查点中移除已检查的点
      const index = this.openSet.indexOf(this.current); //获取当前点的索引
      if (index > -1) this.openSet.splice(index, 1); //从数组中移除

      //遍历当前点的邻居
      for (let neighbour of this.current.neighbours) {
        //如果没有检查，并且不是障碍物
        if (!this.closedSet.includes(neighbour) && !neighbour.isObstacle) {
          //将邻居添加到待检查点中
          if (!this.openSet.includes(neighbour)) {
            this.openSet.push(neighbour);
          }

          neighbour.totalCost = this.heuristic(neighbour, this.end); //计算邻居到终点的估算成本
          neighbour.previous = this.current;
        }
      }
    }

    this.displayBoard();
    this.path.length === 0 && console.log("无路可走！"); //如果没有找到路径则输出提示
  }

  /** @description 判断网格和对角邻居两侧是否被障碍物阻挡
   * @param x 网格的x坐标
   * @param y 网格的y坐标
   * @param dx 网格邻居坐标
   * @param dy 网格邻居坐标
   */
  private isBlockedInDiagonal(x: number, y: number, dx: number, dy: number) {
    const obstruct =
      this.getTileAtPos(x, dy)?.isObstacle || //检查网格与对角邻居y轴上的障碍物
      this.getTileAtPos(dx, y)?.isObstacle; //检查对角邻居与网格y轴上的障碍物
    return obstruct;
  }

  /** @description 获取指定坐标的格子 */
  private getTileAtPos(x: number, y: number) {
    if (this.board[x] && this.board[x][y]) return this.board[x][y];
    return null;
  }

  /** @description 计算当前网格到终点网格的成本 */
  private heuristic(start: Spot, end: Spot) {
    // Math.abs(start.x - end.x) + Math.abs(start.y - end.y); //使用曼哈顿距离
    //使用欧氏距离
    return Math.sqrt(
      Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2)
    );
  }

  /** @description 绘制路径 */
  private displayBoard() {
    this.path.forEach((tile) => {
      const spot = new LibContainerSize(14, 14, "#5555ff");
      spot.x = tile.x * 15;
      spot.y = tile.y * 15;
      this.addChild(spot); //将格子添加到容器中
    });
  }

  /** @description 绘制单格 */
  private drawTile(tile: Spot) {
    const spot = new LibContainerSize(
      14,
      14,
      tile.isObstacle ? "#000" : "#ccc"
    );
    spot.x = tile.x * 15;
    spot.y = tile.y * 15;
    this.addChild(spot); //将格子添加到容器中
  }

  private moveSquareAlongPath() {
    //沿着路径移动方块
    const pathCoordinates = this.path.map((spot) => ({
      //获取路径点的坐标
      x: spot.x * 15 + 7, //计算x坐标
      y: spot.y * 15 + 7, //计算y坐标
    }));

    gsap.to(this.square, {
      motionPath: {
        path: pathCoordinates, //设置路径
        align: "self", //对齐方式
        alignOrigin: [0.5, 0.5], //对齐原点
      },
      duration: 5, //动画持续时间
      ease: "linear", //动画缓动方式
    });
  }

  /** @description 绘制移动方块 */
  private drawSquare() {
    this.square = new LibContainerSize(15, 15, "red");
    this.addChild(this.square);
    this.square.pivot.set(7.5, 7.5);
  }
}

/** @description 网格中的格子 */
class Spot {
  /** x坐标 */
  x: number;
  /** y坐标 */
  y: number;
  /** 总成本 */
  totalCost = 0;
  /** 邻居数组 */
  neighbours: Spot[] = [];
  /** 前一个点 */
  previous: Spot | null = null;
  /** 是否是障碍物 */
  isObstacle = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
