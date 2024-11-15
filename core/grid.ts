import Tile from "./tile";

interface Position {
  x: number;
  y: number;
}

interface TileState {
  position: Position;
  value: number;
}

interface GridState {
  size: number;
  cells: (TileState | null)[][];
}

export default class Grid {
  size: number;
  cells: (Tile | null)[][];

  constructor(size: number, previousState?: GridState) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
  }

  // Build a grid of the specified size
  private empty(): (Tile | null)[][] {
    const cells: (Tile | null)[][] = [];

    for (let x = 0; x < this.size; x++) {
      const row: (Tile | null)[] = (cells[x] = []);

      for (let y = 0; y < this.size; y++) {
        row.push(null);
      }
    }

    return cells;
  }

  private fromState(state: GridState): (Tile | null)[][] {
    const cells: (Tile | null)[][] = [];

    for (let x = 0; x < this.size; x++) {
      const row: (Tile | null)[] = (cells[x] = []);

      for (let y = 0; y < this.size; y++) {
        const tile = state.cells[x][y];
        row.push(tile ? new Tile(tile.position, tile.value) : null);
      }
    }

    return cells;
  }

  // Find the first available random position
  public randomAvailableCell(): Position | undefined {
    const cells = this.availableCells();
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
    return undefined;
  }

  public availableCells(): Position[] {
    const cells: Position[] = [];

    this.eachCell((x: number, y: number, tile: Tile | null) => {
      if (!tile) {
        cells.push({ x, y });
      }
    });

    return cells;
  }

  // Call callback for every cell
  public eachCell(
    callback: (x: number, y: number, tile: Tile | null) => void
  ): void {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        callback(x, y, this.cells[x][y]);
      }
    }
  }

  public cellsAvailable(): boolean {
    return this.availableCells().length > 0;
  }

  public cellAvailable(cell: Position): boolean {
    return !this.cellOccupied(cell);
  }

  public cellOccupied(cell: Position): boolean {
    return !!this.cellContent(cell);
  }

  public cellContent(cell: Position): Tile | null {
    if (this.withinBounds(cell)) {
      return this.cells[cell.x][cell.y];
    }
    return null;
  }

  public insertTile(tile: Tile): void {
    this.cells[tile.x][tile.y] = tile;
  }

  public removeTile(tile: Tile): void {
    this.cells[tile.x][tile.y] = null;
  }

  public withinBounds(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < this.size &&
      position.y >= 0 &&
      position.y < this.size
    );
  }

  public serialize(): GridState {
    const cellState: (TileState | null)[][] = [];

    for (let x = 0; x < this.size; x++) {
      const row: (TileState | null)[] = (cellState[x] = []);

      for (let y = 0; y < this.size; y++) {
        row.push(this.cells[x][y] ? this.cells[x][y]!.serialize() : null);
      }
    }

    return {
      size: this.size,
      cells: cellState,
    };
  }
}
