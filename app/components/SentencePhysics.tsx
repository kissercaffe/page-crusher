"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

interface SentencePhysicsProps {
  sentences: string[];
}

interface SentencePosition {
  id: number;
  sentence: string;
  x: number;
  y: number;
  angle: number;
  width: number;
}

interface SentenceBody {
  id: number;
  sentence: string;
  body: Matter.Body;
  width: number;
  splitEnabledAt: number; // 分割が有効になる時間（Date.now()）
}

// 分割後のクールダウン時間（ミリ秒）
const SPLIT_COOLDOWN = 2000;

// 衝突フィルター用カテゴリ
const CATEGORY_WALL = 0x0001;
const CATEGORY_SENTENCE = 0x0002;
const CATEGORY_SINGLE_CHAR = 0x0004;

let nextId = 0;

function splitSentence(sentence: string): [string, string] | null {
  const trimmed = sentence.trim();

  // 1文字以下は分割できない
  if (trimmed.length <= 1) return null;

  // 2文字以上なら文字単位で半分に分割
  const chars = Array.from(trimmed); // サロゲートペア対応
  const midIndex = Math.floor(chars.length / 2);

  const firstHalf = chars.slice(0, midIndex).join("");
  const secondHalf = chars.slice(midIndex).join("");

  // どちらかが空の場合は分割しない
  if (firstHalf.length === 0 || secondHalf.length === 0) {
    return null;
  }

  return [firstHalf, secondHalf];
}

function isSingleChar(sentence: string): boolean {
  return Array.from(sentence.trim()).length === 1;
}

export default function SentencePhysics({ sentences }: SentencePhysicsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Map<number, SentenceBody>>(new Map());
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const [positions, setPositions] = useState<SentencePosition[]>([]);

  const createBody = useCallback(
    (
      sentence: string,
      x: number,
      y: number,
      velocityX: number = 0,
      velocityY: number = 0,
      hasCooldown: boolean = false
    ): SentenceBody | null => {
      const { width: containerWidth } = containerSizeRef.current;
      if (containerWidth === 0) return null;

      const charWidth = 14;
      const maxWidth = containerWidth - 40;
      const sentenceWidth = Math.min(
        Math.max(sentence.length * charWidth, 60),
        maxWidth
      );
      const sentenceHeight = 40;

      const id = nextId++;
      const singleChar = isSingleChar(sentence);

      const body = Matter.Bodies.rectangle(
        x,
        y,
        sentenceWidth,
        sentenceHeight,
        {
          restitution: 0.4,
          friction: 0.5,
          frictionAir: 0.02,
          angle: (Math.random() - 0.5) * 0.3,
          label: `sentence-${id}`,
          collisionFilter: {
            category: singleChar ? CATEGORY_SINGLE_CHAR : CATEGORY_SENTENCE,
            // 1文字は他の文章とのみ衝突、壁とは衝突しない
            // 通常の文章は壁と他の文章の両方と衝突
            mask: singleChar
              ? CATEGORY_SENTENCE | CATEGORY_SINGLE_CHAR
              : CATEGORY_WALL | CATEGORY_SENTENCE | CATEGORY_SINGLE_CHAR,
          },
        }
      );

      // 初速度を設定
      Matter.Body.setVelocity(body, { x: velocityX, y: velocityY });

      return {
        id,
        sentence,
        body,
        width: sentenceWidth,
        splitEnabledAt: hasCooldown ? Date.now() + SPLIT_COOLDOWN : 0,
      };
    },
    []
  );

  useEffect(() => {
    if (!containerRef.current || sentences.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    containerSizeRef.current = { width, height };

    // IDをリセット
    nextId = 0;
    bodiesRef.current.clear();

    // 物理エンジンの作成
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // 重力を設定
    engine.gravity.y = 0.3;

    // 壁を作成（左、右のみ）
    const wallThickness = 50;
    const wallOptions = {
      isStatic: true,
      label: "wall",
      collisionFilter: {
        category: CATEGORY_WALL,
        mask: CATEGORY_SENTENCE, // 通常の文章とのみ衝突
      },
    };
    const walls = [
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        wallOptions
      ),
      Matter.Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        wallOptions
      ),
    ];
    Matter.Composite.add(engine.world, walls);

    // ピン状の床を作成
    const pinCount = 20;
    const pinSpacing = (width - 32) / (pinCount - 1); // px-4 = 16px * 2
    const pinRadius = 6;
    const pinY = height - 20; // bottom-0 pb-2 + h-8/2

    for (let i = 0; i < pinCount; i++) {
      const pinX = 16 + i * pinSpacing; // px-4 = 16px
      const pin = Matter.Bodies.circle(pinX, pinY, pinRadius, {
        isStatic: true,
        label: "pin",
        collisionFilter: {
          category: CATEGORY_WALL,
          mask: CATEGORY_SENTENCE, // 通常の文章とのみ衝突、1文字は通過
        },
      });
      Matter.Composite.add(engine.world, pin);
    }

    // 初期文章ボディを作成
    sentences.forEach((sentence, index) => {
      const charWidth = 14;
      const maxWidth = width - 40;
      const sentenceWidth = Math.min(
        Math.max(sentence.length * charWidth, 60),
        maxWidth
      );
      const x = Math.random() * (width - sentenceWidth) + sentenceWidth / 2;
      const y = -100 - index * 400; // 1つずつ順番に落ちてくるよう間隔を広げる

      const sentenceBody = createBody(sentence, x, y);
      if (sentenceBody) {
        bodiesRef.current.set(sentenceBody.id, sentenceBody);
        Matter.Composite.add(engine.world, sentenceBody.body);
      }
    });

    // 衝突処理用のセット（同じフレームで重複処理を避ける）
    const processedCollisions = new Set<string>();

    // 衝突イベントを検出
    Matter.Events.on(engine, "collisionStart", (event) => {
      const pairs = event.pairs;
      const now = Date.now();

      for (const pair of pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // 壁・ピンとの衝突は無視
        if (
          bodyA.label === "wall" ||
          bodyB.label === "wall" ||
          bodyA.label === "pin" ||
          bodyB.label === "pin"
        )
          continue;

        // 両方が文章ボディの場合のみ処理
        if (
          !bodyA.label?.startsWith("sentence-") ||
          !bodyB.label?.startsWith("sentence-")
        )
          continue;

        const idA = parseInt(bodyA.label.replace("sentence-", ""));
        const idB = parseInt(bodyB.label.replace("sentence-", ""));

        // 同じ衝突を2回処理しない
        const collisionKey = [idA, idB].sort().join("-");
        if (processedCollisions.has(collisionKey)) continue;
        processedCollisions.add(collisionKey);

        const sentenceBodyA = bodiesRef.current.get(idA);
        const sentenceBodyB = bodiesRef.current.get(idB);

        if (!sentenceBodyA || !sentenceBodyB) continue;

        // 両方の文章を分割
        const toAdd: SentenceBody[] = [];
        const toRemove: number[] = [];

        for (const sb of [sentenceBodyA, sentenceBodyB]) {
          // クールダウン中は分割しない
          if (sb.splitEnabledAt > now) continue;

          const split = splitSentence(sb.sentence);
          if (split) {
            const [first, second] = split;
            const pos = sb.body.position;
            const vel = sb.body.velocity;

            // 分割した文章を少し離れた位置に配置（クールダウン付き）
            const offset = 30;
            const newBody1 = createBody(
              first,
              pos.x - offset,
              pos.y,
              vel.x - 2,
              vel.y - 1,
              true // クールダウンを有効化
            );
            const newBody2 = createBody(
              second,
              pos.x + offset,
              pos.y,
              vel.x + 2,
              vel.y - 1,
              true // クールダウンを有効化
            );

            if (newBody1) toAdd.push(newBody1);
            if (newBody2) toAdd.push(newBody2);
            toRemove.push(sb.id);
          }
        }

        // 古いボディを削除
        for (const id of toRemove) {
          const sb = bodiesRef.current.get(id);
          if (sb) {
            Matter.Composite.remove(engine.world, sb.body);
            bodiesRef.current.delete(id);
          }
        }

        // 新しいボディを追加
        for (const sb of toAdd) {
          bodiesRef.current.set(sb.id, sb);
          Matter.Composite.add(engine.world, sb.body);
        }
      }

      // 処理済みセットをクリア
      processedCollisions.clear();
    });

    // アニメーションループ
    let animationId: number;
    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);

      // 画面外に落ちたボディを削除
      const toDelete: number[] = [];
      bodiesRef.current.forEach((sb) => {
        if (sb.body.position.y > height + 200) {
          toDelete.push(sb.id);
        }
      });
      for (const id of toDelete) {
        const sb = bodiesRef.current.get(id);
        if (sb) {
          Matter.Composite.remove(engine.world, sb.body);
          bodiesRef.current.delete(id);
        }
      }

      // 位置を更新
      const newPositions: SentencePosition[] = [];
      bodiesRef.current.forEach((sb) => {
        newPositions.push({
          id: sb.id,
          sentence: sb.sentence,
          x: sb.body.position.x,
          y: sb.body.position.y,
          angle: sb.body.angle,
          width: sb.width,
        });
      });
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
    const currentBodiesRef = bodiesRef.current;
    return () => {
      cancelAnimationFrame(animationId);
      Matter.Events.off(engine, "collisionStart");
      Matter.Engine.clear(engine);
      Matter.Composite.clear(engine.world, false);
      currentBodiesRef.clear();
    };
  }, [sentences, createBody]);

  return (
    <div
      ref={containerRef}
      className="relative h-[600px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    >
      {positions.map((pos) => (
        <div
          key={pos.id}
          className="absolute cursor-grab select-none overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800 active:cursor-grabbing dark:bg-zinc-800 dark:text-zinc-200"
          style={{
            left: pos.x,
            top: pos.y,
            width: pos.width,
            transform: `translate(-50%, -50%) rotate(${pos.angle}rad)`,
          }}
        >
          {pos.sentence}
        </div>
      ))}

      {/* ピン状の床 */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-around px-4 pb-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-5 w-3 rounded-full bg-zinc-400 shadow-md dark:bg-zinc-500"
            style={{
              background: "linear-gradient(135deg, #a1a1aa 0%, #71717a 50%, #52525b 100%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
