import Grid from "./grid";
import Tile from "./tile";
import { EventManager } from "./event_manager";
import { HTMLActuator } from "./html_actuator";

interface Position {
  x: number;
  y: number;
}

interface Vector {
  x: number;
  y: number;
}

interface Traversal {
  x: number[];
  y: number[];
}

export default class GameManager {
  private size: number;
  private grid: Grid;
  private startTiles: number = 2;
  private eventManager: EventManager;
  private actuator: HTMLActuator;

  constructor(public container: HTMLElement, size: number) {
    this.size = size;
    this.grid = new Grid(this.size);
    this.eventManager = new EventManager();
    this.actuator = new HTMLActuator(this.container);

    // 初始化触摸和键盘事件
    this.initializeInputEvents();
    this.setup();
  }

  private initializeInputEvents(): void {
    // 键盘事件
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      const mapped = this.mapKeyToDirection(event.key);
      if (mapped !== undefined) {
        event.preventDefault();
        this.eventManager.emit("move", mapped);
      }
    });

    // 触摸事件
    let touchStartX: number = 0;
    let touchStartY: number = 0;
    const gameContainer = this.container;

    gameContainer?.addEventListener("touchstart", (event: TouchEvent) => {
      if (event.touches.length > 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    });

    gameContainer?.addEventListener("touchend", (event: TouchEvent) => {
      if (event.touches.length > 0) return;

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      const direction = this.mapSwipeToDirection(dx, dy);
      if (direction !== undefined) {
        event.preventDefault();
        this.eventManager.emit("move", direction);
      }
    });

    // 监听移动事件
    this.eventManager.on("move", (direction: number) => {
      if (this.move(direction)) {
        // 移动成功后可以触发其他事件
        this.eventManager.emit("moveComplete");
      }
    });
  }

  private mapKeyToDirection(key: string): number | undefined {
    const keyMap: { [key: string]: number } = {
      ArrowUp: 0,
      ArrowRight: 1,
      ArrowDown: 2,
      ArrowLeft: 3,
      w: 0,
      d: 1,
      s: 2,
      a: 3,
    };
    return keyMap[key];
  }

  private mapSwipeToDirection(dx: number, dy: number): number | undefined {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const minDistance = 10; // 最小滑动距离

    if (Math.max(absDx, absDy) < minDistance) return undefined;

    if (absDx > absDy) {
      return dx > 0 ? 1 : 3; // 右：1，左：3
    } else {
      return dy > 0 ? 2 : 0; // 下：2，上：0
    }
  }

  // 添加事件监听方法
  public on(event: string, callback: (...args: any[]) => void): void {
    this.eventManager.on(event, callback);
  }

  // 移除事件监听方法
  public off(event: string, callback: (...args: any[]) => void): void {
    this.eventManager.off(event, callback);
  }

  private setup(): void {
    this.grid = new Grid(this.size);
    this.addStartTiles();
    this.actuate();
  }

  private actuate(): void {
    this.actuator.actuate(this.grid);
  }

  private addStartTiles(): void {
    for (let i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  }

  private addRandomTile(): void {
    if (this.grid.cellsAvailable()) {
      const value = Math.random() < 0.9 ? 2 : 4;
      const tile = new Tile(this.grid.randomAvailableCell()!, value);
      this.grid.insertTile(tile);
    }
  }

  private prepareTiles(): void {
    this.grid.eachCell((x: number, y: number, tile: Tile | null) => {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  private moveTile(tile: Tile, cell: Position): void {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  public move(direction: number): boolean {
    const vector = this.getVector(direction);
    const traversals = this.buildTraversals(vector);
    let moved = false;

    this.prepareTiles();

    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        const cell: Position = { x, y };
        const tile = this.grid.cellContent(cell);

        if (tile) {
          const positions = this.findFarthestPosition(cell, vector);
          const next = this.grid.cellContent(positions.next);

          if (next && next.value === tile.value && !next.mergedFrom) {
            const merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            this.grid.insertTile(merged);
            this.grid.removeTile(tile);
            tile.updatePosition(positions.next);
          } else {
            this.moveTile(tile, positions.farthest);
          }

          if (!this.positionsEqual(cell, tile)) {
            moved = true;
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();
      this.actuate();
    }

    return moved;
  }

  private getVector(direction: number): Vector {
    const map: { [key: number]: Vector } = {
      0: { x: 0, y: -1 }, // Up
      1: { x: 1, y: 0 }, // Right
      2: { x: 0, y: 1 }, // Down
      3: { x: -1, y: 0 }, // Left
    };
    return map[direction];
  }

  private buildTraversals(vector: Vector): Traversal {
    const traversals: Traversal = { x: [], y: [] };

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();

    return traversals;
  }

  private findFarthestPosition(
    cell: Position,
    vector: Vector
  ): { farthest: Position; next: Position } {
    let previous: Position;

    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

    return {
      farthest: previous,
      next: cell,
    };
  }

  public movesAvailable(): boolean {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }

  private tileMatchesAvailable(): boolean {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.grid.cellContent({ x, y });

        if (tile) {
          for (let direction = 0; direction < 4; direction++) {
            const vector = this.getVector(direction);
            const cell = { x: x + vector.x, y: y + vector.y };
            const other = this.grid.cellContent(cell);

            if (other && other.value === tile.value) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private positionsEqual(first: Position, second: Position): boolean {
    return first.x === second.x && first.y === second.y;
  }
}
