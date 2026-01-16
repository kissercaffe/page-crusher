# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

page-crusherはNext.js 16 + React 19 + TypeScript 5のWebアプリケーション。Webページのコンテンツ解析（`@mozilla/readability`）と物理エンジンによるインタラクティブなアニメーション（`matter-js`）を組み合わせた機能を持つ。
のアプリケーションはURLを受け取って、そのページ内の本文をスクレイピング、単語を抽出してページに表示します。
ページに表示された単語はmatter-jsで重力などのアニメーションが付与されます。

## Development Commands

```bash
# 開発サーバー起動（ホットリロード）
bun dev

# 本番ビルド
bun run build

# 本番サーバー起動
bun start

# リント実行
bun run lint
```

## Architecture

- **App Router**: Next.js 13+のファイルベースルーティング（`app/`ディレクトリ）
- **スタイリング**: Tailwind CSS v4 + PostCSS、ダークモード対応
- **パッケージマネージャー**: Bun
- **パスエイリアス**: `@/*` がプロジェクトルートにマッピング

## Key Dependencies

- `@mozilla/readability`: Webページから可読コンテンツを抽出
- `matter-js`: 2D物理エンジン（インタラクティブUI用）

## Code Conventions

- TypeScript strict modeが有効
- ESLint 9のフラットコンフィグ形式（Next.js + TypeScript推奨設定）
- Tailwindユーティリティクラスでスタイリング
