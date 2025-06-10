# icepuma.dev

My personal website with a terminal interface built with Astro and TypeScript.

## Features

- 🖥️ Interactive terminal interface
- 🎨 Theme switching (dark/light/system)
- ⌨️ Smart autocompletion with TAB cycling
- 🎥 Letterboxd movie integration
- 📱 Responsive design
- ⚡ Built with Astro for optimal performance

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

This project uses Playwright for end-to-end testing. The tests cover:

- Terminal functionality and commands
- Autocompletion behavior
- Theme switching
- UI interactions

### Running Tests

```bash
# Run all tests headlessly (with dot reporter)
bun run test

# Run tests with UI mode (for debugging)
bun run test:ui
```

### Data Updates

```bash
# Update movie data from Letterboxd
uv run scripts/fetch-letterboxd-movies.py
```

## Commands

Available terminal commands:

- `help` - Show all available commands
- `clear` - Clear the terminal screen
- `bio` - Display personal biography
- `links` - Show social media links
- `projects` - List my projects
- `movies` - Display watched movies from Letterboxd
- `mode <theme>` - Switch theme (dark/light/system)

## Technology Stack

- **Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Runtime**: [Bun](https://bun.sh/)
- **Testing**: [Playwright](https://playwright.dev/)
- **Code Quality**: [Biome](https://biomejs.dev/)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Font**: [JetBrains Mono](https://www.jetbrains.com/lp/mono/)

## Development Attribution

This project was vibecoded with ❤️ using [Claude Code](https://claude.ai/code) + [Claude 4 Opus](https://www.anthropic.com/claude) 🚀

