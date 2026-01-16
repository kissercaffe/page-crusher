"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface WordPhysicsProps {
  words: string[];
}

interface WordPosition {
  word: string;
  x: number;
  y: number;
  angle: number;
}

export default function WordPhysics({ words }: WordPhysicsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const wordBodiesRef = useRef<{ word: string; body: Matter.Body }[]>([]);
  const [positions, setPositions] = useState<WordPosition[]>([]);

  useEffect(() => {
    if (!containerRef.current || words.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 物理エンジンの作成
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // 重力を設定
    engine.gravity.y = 0.5;

    // 壁を作成（左、右、下）
    const wallThickness = 50;
    const walls = [
      // 下の壁
      Matter.Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width,
        wallThickness,
        { isStatic: true }
      ),
      // 左の壁
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        { isStatic: true }
      ),
      // 右の壁
      Matter.Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        { isStatic: true }
      ),
    ];
    Matter.Composite.add(engine.world, walls);

    // 単語ボディを作成
    const bodies: { word: string; body: Matter.Body }[] = [];
    words.forEach((word, index) => {
      // 単語の長さに応じてサイズを調整
      const wordWidth = Math.max(word.length * 12, 40);
      const wordHeight = 32;

      // ランダムな初期位置（上部から）
      const x = Math.random() * (width - wordWidth) + wordWidth / 2;
      const y = -50 - Math.random() * 500 - index * 30; // 時間差で落ちてくる

      const body = Matter.Bodies.rectangle(x, y, wordWidth, wordHeight, {
        restitution: 0.3, // 弾性
        friction: 0.5,
        frictionAir: 0.01,
        angle: (Math.random() - 0.5) * 0.5, // 少し傾ける
      });

      bodies.push({ word, body });
      Matter.Composite.add(engine.world, body);
    });

    wordBodiesRef.current = bodies;

    // アニメーションループ
    let animationId: number;
    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);

      // 位置を更新
      const newPositions: WordPosition[] = bodies.map((wb) => ({
        word: wb.word,
        x: wb.body.position.x,
        y: wb.body.position.y,
        angle: wb.body.angle,
      }));
      setPositions(newPositions);

      animationId = requestAnimationFrame(update);
    };
    update();

    // マウス操作を追加
    const mouse = Matter.Mouse.create(container);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Matter.Composite.add(engine.world, mouseConstraint);

    // クリーンアップ
    return () => {
      cancelAnimationFrame(animationId);
      Matter.Engine.clear(engine);
      Matter.Composite.clear(engine.world, false);
      wordBodiesRef.current = [];
    };
  }, [words]);

  return (
    <div
      ref={containerRef}
      className="relative h-[600px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    >
      {positions.map((pos, index) => (
        <div
          key={index}
          className="absolute cursor-grab select-none rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 active:cursor-grabbing dark:bg-zinc-800 dark:text-zinc-200"
          style={{
            left: pos.x,
            top: pos.y,
            transform: `translate(-50%, -50%) rotate(${pos.angle}rad)`,
          }}
        >
          {pos.word}
        </div>
      ))}
    </div>
  );
}
