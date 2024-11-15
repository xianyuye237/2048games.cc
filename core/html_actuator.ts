import Grid from "./grid";
import Tile from "./tile";

interface Position {
  x: number;
  y: number;
}

export class HTMLActuator {
  private tileContainer: HTMLElement;
  private gridContainer: HTMLElement;

  constructor(container: HTMLElement) {
    this.gridContainer = container;
    this.tileContainer = document.createElement("div");
    this.tileContainer.className = "absolute z-20";

    // 创建背景网格
    this.createGrid();

    // 添加瓦片容器
    this.gridContainer.appendChild(this.tileContainer);
  }

  private createGrid(): void {
    const gridCell = document.createElement("div");
    gridCell.className = "absolute z-10 grid grid-cols-4 gap-2.5 w-full h-full";

    for (let i = 0; i < 16; i++) {
      const cell = document.createElement("div");
      cell.className = "bg-[#EEE4DA]/35 rounded";
      gridCell.appendChild(cell);
    }

    this.gridContainer.appendChild(gridCell);
  }

  public actuate(grid: Grid): void {
    this.clearContainer();

    grid.cells.forEach((column, x) => {
      column.forEach((tile, y) => {
        if (tile) {
          this.addTile(tile);
        }
      });
    });
  }

  private clearContainer(): void {
    while (this.tileContainer.firstChild) {
      this.tileContainer.removeChild(this.tileContainer.firstChild);
    }
  }

  private addTile(tile: Tile): void {
    const wrapper = document.createElement("div");
    const inner = document.createElement("div");
    const position = this.positionToPixels(tile);

    // 设置类名
    wrapper.className = `absolute w-[100px] h-[100px] rounded transition-transform duration-100 ease-in-out
      ${this.getTileColorClass(tile.value)}
      ${tile.mergedFrom ? "animate-pop" : ""}
      ${!tile.previousPosition ? "animate-appear" : ""}`;
    inner.className =
      "flex items-center justify-center w-full h-full text-3xl font-bold";
    inner.textContent = tile.value.toString();

    // 设置位置
    wrapper.style.transform = `translate(${position.x}px, ${position.y}px)`;

    wrapper.appendChild(inner);
    this.tileContainer.appendChild(wrapper);
  }

  private positionToPixels(tile: Tile): Position {
    const tileSize = 100; // 瓦片大小（像素）
    const tileGap = 10; // 瓦片间隙（像素）

    return {
      x: tile.x * (tileSize + tileGap) + tileGap,
      y: tile.y * (tileSize + tileGap) + tileGap,
    };
  }

  private getTileColorClass(value: number): string {
    const colorMap: { [key: number]: string } = {
      2: "bg-[#eee4da]",
      4: "bg-[#ede0c8]",
      8: "bg-[#f2b179]",
      16: "bg-[#f59563]",
      32: "bg-[#f67c5f]",
      64: "bg-[#f65e3b]",
      128: "bg-[#edcf72]",
      256: "bg-[#edcc61]",
      512: "bg-[#edc850]",
      1024: "bg-[#edc53f]",
      2048: "bg-[#edc22e]",
    };
    return colorMap[value] || "bg-[#eee4da]";
  }
}
