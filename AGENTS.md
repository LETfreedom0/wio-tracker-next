# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview
This is a WIO (Work In Office) tracking application with a Next.js frontend and standalone HTML interfaces for calendar and settings.

## Non-Obvious Project Structure
- **Dual Interface Architecture**: The project contains both a Next.js app (`src/app/`) and standalone HTML interfaces (`wio日历主界面/`, `wio设置界面/`) that appear to be separate from the main Next.js application
- **Chinese Interface Names**: Directory names use Chinese characters (`wio日历主界面` = "WIO Calendar Main Interface", `wio设置界面` = "WIO Settings Interface")
- **Standalone HTML Files**: The calendar and settings interfaces are complete HTML files with embedded Tailwind CSS via CDN, separate from the Next.js build system

## Critical Technical Details
- **Tailwind CSS Version Mismatch**: Next.js app uses Tailwind v4 (`@tailwindcss/postcss`) while standalone HTML files use Tailwind CDN (`tailwindcss.com?plugins=forms,container-queries`)
- **Custom CSS Variables**: Standalone interfaces define extensive custom color schemes with `-light` and `-dark` suffixes that differ from the Next.js app's simpler theming approach
- **Progress Bar Implementation**: Calendar interface uses CSS custom properties (`--wio-percentage`) for dynamic progress indication
- **Local Data Storage**: Both interfaces emphasize "数据本地保存" (data saved locally) suggesting browser-based persistence without server communication

## Development Commands
Standard Next.js commands apply, but note:
- `npm run dev` - Starts Next.js dev server (standalone HTML files are static and don't require compilation)
- `npm run build` - Only builds the Next.js portion (standalone HTML files are already complete)

## Code Style Considerations
- **Mixed Languages**: Interface contains both English and Chinese text
- **Icon SVGs**: Custom SVG icons embedded directly in HTML rather than imported as components
