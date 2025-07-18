# icepuma.dev

Personal portfolio website built with Astro, TypeScript, and Tailwind CSS v4.

## Key Files

### Components
- `src/components/ThemeSwitcher.astro` - Theme toggle component
- `src/components/Nav.astro` - Main navigation
- `src/components/PageHeader.astro` - Page title component
- `src/components/Prose.astro` - Blog post content styling
- `src/components/Tag.astro` - Tag pills for categories
- `src/components/ListItem.astro` - List item for projects
- `src/components/MovieGrid.astro` - Movie poster grid with images

### Layouts
- `src/layouts/MinimalLayout.astro` - Base layout with theme support

### Utilities
- `src/utils/theme.ts` - Theme management functions

### Data
- `src/data/projects.ts` - Project listings
- `src/data/social-links.ts` - Social media links
- `src/data/movies.json` - Movie list summary
- `scripts/fetch-letterboxd-movies.py` - Fetch movie data and posters

### Content Collections
- `src/content/config.ts` - Content collection schemas
- `src/content/movies/` - Movie entries with poster images

### Styling
- `src/styles/global.css` - Theme definitions and CSS variables

## Commands

```bash
# Development
bun run dev

# Build (includes lint, format, typecheck)
bun run build

# Data Updates
uv run scripts/fetch-letterboxd-movies.py         # Uses 30-day cache
uv run scripts/fetch-letterboxd-movies.py --force # Force refresh all data
```

## Theme System

The site uses a CSS variable-based theme system with Tailwind CSS v4:

1. **CSS Variables**: Defined in `global.css` using HSL format for opacity support
2. **Theme Switching**: Uses `data-theme` attribute on HTML element
3. **Semantic Colors**: `background`, `foreground`, `primary`, `secondary`, etc.
4. **Nord Palette**: All colors based on the Nord color scheme

### Color Usage

```css
/* Use semantic colors */
bg-background     /* Main background */
text-foreground   /* Main text */
bg-primary        /* Primary actions */
text-muted-foreground /* Secondary text */
border-border     /* Borders */

/* Direct Nord colors still available */
bg-nord0 through bg-nord15
```

## Movie Collection

The site fetches movie data from Letterboxd and displays posters:

1. **Monthly caching**: Data cached for 30 days to minimize API calls
2. **Smart updates**: Only downloads new/missing posters
3. **Content collection**: Movies stored as individual JSON files with poster images
4. **Search functionality**: Real-time filtering with keyboard shortcuts (/ or Cmd+K)
5. **Image optimization**: Astro automatically converts posters to WebP format

## Conventions

- Use tabs for indentation
- Run `bun run build` before committing (includes linting and formatting)
- Use semantic color names instead of direct Nord colors where possible
- Keep components small and focused
- Prefer Astro components over framework components for static content