"use client";

import { useState, useTransition } from "react";
import { scrapeAndExtractWords, ScrapingResult } from "./actions";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await scrapeAndExtractWords(url);
      setResult(res);
    });
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

        {result?.success && result.words && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              {result.words.length}語を抽出しました
            </p>
            <div className="flex flex-wrap gap-2">
              {result.words.map((word, index) => (
                <span
                  key={index}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
