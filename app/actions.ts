"use server";

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export interface PageMeta {
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

export interface ScrapingResult {
  success: boolean;
  meta?: PageMeta;
  words?: string[];
  error?: string;
}

function getMetaContent(document: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const content = element.getAttribute("content");
      if (content) return content;
    }
  }
  return undefined;
}

export async function scrapeAndExtractWords(
  url: string
): Promise<ScrapingResult> {
  try {
    // URLの検証
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { success: false, error: "HTTPまたはHTTPSのURLを入力してください" };
    }

    // ページを取得
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `ページの取得に失敗しました: ${response.status}`,
      };
    }

    const html = await response.text();

    // JSDOMでHTMLをパース
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // メタ情報を取得
    const title =
      getMetaContent(document, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
      ]) ||
      document.querySelector("title")?.textContent ||
      parsedUrl.hostname;

    const description = getMetaContent(document, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]);

    let image = getMetaContent(document, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]);

    // 相対URLを絶対URLに変換
    if (image && !image.startsWith("http")) {
      image = new URL(image, url).href;
    }

    const siteName =
      getMetaContent(document, ['meta[property="og:site_name"]']) ||
      parsedUrl.hostname;

    const meta: PageMeta = {
      title,
      description,
      image,
      siteName,
      url,
    };

    // Readabilityで本文を抽出
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return { success: false, error: "本文を抽出できませんでした" };
    }

    // Intl.Segmenterで単語を抽出（日本語対応）
    const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
    const segments = segmenter.segment(article.textContent);

    // 単語のみを抽出（記号や空白を除外）
    const words: string[] = [];
    for (const segment of segments) {
      if (segment.isWordLike) {
        const word = segment.segment.trim();
        if (word.length > 0) {
          words.push(word);
        }
      }
    }

    // 重複を除去してシャッフル、最大100語を返す
    const uniqueWords = [...new Set(words)];
    const shuffled = uniqueWords.sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, 100);

    return { success: true, meta, words: selectedWords };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Invalid URL")) {
        return { success: false, error: "無効なURLです" };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "不明なエラーが発生しました" };
  }
}
