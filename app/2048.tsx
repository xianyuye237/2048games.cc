"use client";

import GameManager from "../core/game_manager";
import { useEffect, useRef } from "react";

export default function Game2048() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const gameManager = new GameManager(ref.current, 4);

    gameManager.on("moveComplete", () => {
      console.log("移动完成");
    });

    gameManager.on("move", (direction: number) => {
      console.log("移动方向:", direction);
    });
  }, []);

  return (
    <div
      className="relative w-[450px] h-[450px] p-2.5 bg-[#bbada0] rounded-md"
      ref={ref}
    ></div>
  );
}
