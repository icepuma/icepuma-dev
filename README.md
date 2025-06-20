# icepuma.dev

My personal website built with Astro, TypeScript, and Tailwind CSS v4.

## Features

- 📝 Blog with MDX support
- 🎨 Theme switching (dark/light/system) with Nord color palette
- 📱 Fully responsive design
- 🎬 Letterboxd movie integration
- 🚀 Optimized performance with Astro
- 🌐 Open source projects showcase

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## Testing

This project uses Playwright for end-to-end testing.

```bash
# Run all tests
bun run test

# Run tests with UI mode (for debugging)
bun run test:ui

# Run tests with browser visible
bun run test:headed
```

## Data Updates

```bash
# Update movie data from Letterboxd
uv run scripts/fetch-letterboxd-movies.py
```

## Project Structure

```
src/
├── components/       # Reusable Astro components
├── content/         # Blog posts (MDX)
├── data/           # Static data (projects, links)
├── layouts/        # Page layouts
├── pages/          # Route pages
├── styles/         # Global styles and theme
└── utils/          # Utility functions
```

## Theming

The site uses a custom theming system based on the Nord color palette with CSS variables and Tailwind CSS v4:

- CSS variables defined in `src/styles/global.css`
- Theme switching via `data-theme` attribute
- Semantic color names for easy customization
- Full dark mode support

## Technology Stack

- **Framework**: [Astro](https://astro.build/) v5
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Runtime**: [Bun](https://bun.sh/)
- **Testing**: [Playwright](https://playwright.dev/)
- **Code Quality**: [Biome](https://biomejs.dev/)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Font**: [JetBrains Mono](https://www.jetbrains.com/lp/mono/)

## License

MIT

## Development Attribution

This project was developed with ❤️ using [Claude Code](https://claude.ai/code) + [Claude 4 Opus](https://www.anthropic.com/claude) 🚀