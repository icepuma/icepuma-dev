# icepuma.dev

My personal website with a terminal interface built with Astro and TypeScript.

## Features

- 🖥️ Interactive terminal interface
- 🎨 Theme switching (dark/light/system)
- ⌨️ Smart autocompletion with TAB cycling
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
# Run all tests headlessly
bun run test

# Run tests with UI mode (recommended for development)
bun run test:ui

# Run tests with browser visible
bun run test:headed

# Debug tests step by step
bun run test:debug
```

### Test Coverage

- **Terminal Component**: Basic functionality, command execution, error handling
- **Autocompletion**: Ghost text, TAB completion, argument cycling
- **Theme Switching**: Dark/light/system modes, persistence
- **UI Elements**: Cursor behavior, input display, scrolling

The tests automatically start the development server, so make sure port 4321 is available.

## Commands

Available terminal commands:

- `help` - Show all available commands
- `clear` - Clear the terminal screen
- `bio` - Display personal biography
- `links` - Show social media links
- `projects` - List my projects
- `mode <theme>` - Switch theme (dark/light/system)

## Technology Stack

- **Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Runtime**: [Bun](https://bun.sh/)
- **Testing**: [Playwright](https://playwright.dev/)
- **Linting/Formatting**: [Biome](https://biomejs.dev/)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)

## Development Attribution

This project was vibecoded with ❤️ using [Cursor](https://cursor.sh/) + [Claude 4 Sonnet](https://www.anthropic.com/claude) 🚀

