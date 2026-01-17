"use client";

import { useState, useTransition } from "react";
import { scrapeAndExtractWords, ScrapingResult } from "./actions";
import SentencePhysics from "./components/SentencePhysics";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showWords, setShowWords] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowWords(false);
    startTransition(async () => {
      const res = await scrapeAndExtractWords(url);
      setResult(res);
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsOverTrash(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrash(true);
  };

  const handleDragLeave = () => {
    setIsOverTrash(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrash(false);
    setIsDragging(false);
    setShowWords(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <main className="w-full max-w-4xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-black dark:text-white">
          Page Crusher
        </h1>

        <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URLを入力してください"
            required
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-black placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "読み込み中..." : "抽出"}
          </button>
        </form>

        {result?.error && (
          <div className="mb-8 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {result.error}
          </div>
        )}

        {result?.success && result.meta && !showWords && (
          <>
            <div
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className={`mb-6 cursor-grab overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900 ${
                isDragging ? "opacity-50 scale-95" : "hover:shadow-lg"
              }`}
            >
              {result.meta.image && (
                <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.meta.image}
                    alt={result.meta.title}
                    className="h-full w-full object-cover pointer-events-none"
                  />
                </div>
              )}
              <div className="p-4">
                <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {result.meta.siteName}
                </p>
                <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-black dark:text-white">
                  {result.meta.title}
                </h2>
                {result.meta.description && (
                  <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {result.meta.description}
                  </p>
                )}
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all ${
                isOverTrash
                  ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
                  : "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`h-12 w-12 transition-colors ${
                  isOverTrash
                    ? "text-red-500 dark:text-red-400"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              <p
                className={`mt-2 text-sm transition-colors ${
                  isOverTrash
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                ここにカードをドロップして粉砕
              </p>
            </div>
          </>
        )}

        {showWords && result?.success && result.sentences && (
          <div>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              {result.sentences.length}文を抽出しました
            </p>
            <SentencePhysics sentences={result.sentences} />
          </div>
        )}
      </main>
    </div>
  );
}
