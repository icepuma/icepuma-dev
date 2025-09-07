#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "beautifulsoup4",
#   "requests",
#   "lxml",
#   "playwright",
# ]
# ///

"""Fetch movies from Letterboxd. Only images are cached, movie data is always fetched fresh."""

import json
import re
import sys
import time
from pathlib import Path
from typing import TypedDict, NotRequired

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlsplit

# Headless support for resolving poster URLs rendered client-side (required)
try:
    from playwright.sync_api import sync_playwright, Browser, Page
except Exception:
    sync_playwright = None  # type: ignore
    Browser = Page = None  # type: ignore


class Movie(TypedDict):
    title: str
    url: str
    image_url: str | None
    cached_image: str | None
    film_id: NotRequired[int | None]
    film_slug: NotRequired[str | None]
    cache_busting_key: NotRequired[str | None]


def extract_title_from_slug(film_slug: str) -> str:
    """Extract title from film slug like 'novocaine-2025' or 'the-lobster-2015'"""
    slug_without_year = re.sub(r'-\d{4}$', '', film_slug)
    return slug_without_year.replace('-', ' ').title()


def fetch_letterboxd_page(username: str, page: int = 1) -> tuple[list[Movie], bool]:
    """Fetch a single page of movies from Letterboxd. Returns (movies_list, has_next_page)

    Supports both the legacy server-rendered markup (li.poster-container) and the
    current LazyPoster React components rendered server-side as placeholders.
    """
    base_url = f"https://letterboxd.com/{username}/films"
    url = f"{base_url}/page/{page}/" if page > 1 else f"{base_url}/"

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "lxml")
        movies: list[Movie] = []

        # 1) New markup: React component placeholders for posters
        lazy_posters = soup.find_all(
            "div",
            class_="react-component",
            attrs={"data-component-class": "globals.comps.LazyPoster"},
        )

        if lazy_posters:
            for el in lazy_posters:
                target_link = el.get("data-item-link") or el.get("data-target-link")
                # Derive slug strictly from the URL when available
                slug_from_url = None
                if target_link and "/film/" in target_link:
                    try:
                        slug_from_url = target_link.rstrip("/").split("/")[-1]
                    except Exception:
                        slug_from_url = None
                # Fallback to attribute if URL missing
                attr_slug = el.get("data-item-slug")
                film_slug = slug_from_url or attr_slug
                film_id_val = None
                try:
                    film_id_str = el.get("data-film-id")
                    if film_id_str:
                        film_id_val = int(film_id_str)
                except Exception:
                    film_id_val = None

                # Prefer original title with year from the list markup
                title_with_year = el.get("data-original-title")
                name = el.get("data-item-name") or ""
                title = (title_with_year or name).strip() or (
                    extract_title_from_slug(film_slug) if film_slug else None
                )

                if not film_slug or not title:
                    continue

                absolute_url = (
                    f"https://letterboxd.com{target_link}"
                    if target_link and target_link.startswith("/")
                    else (f"https://letterboxd.com/film/{film_slug}/" if film_slug else None)
                )
                if not absolute_url:
                    continue

                # parse cache busting key if present
                cache_key = None
                try:
                    rpp = el.get("data-resolvable-poster-path")
                    if rpp:
                        obj = json.loads(rpp)
                        cache_key = obj.get("cacheBustingKey")
                except Exception:
                    cache_key = None

                # We don’t rely on list image URL for downloads
                poster_url_attr = el.get("data-poster-url")
                image_url = (
                    f"https://letterboxd.com{poster_url_attr}"
                    if poster_url_attr and poster_url_attr.startswith("/")
                    else None
                )

                movies.append(
                    Movie(
                        title=title,
                        url=absolute_url,
                        image_url=image_url,
                        cached_image=None,
                        film_id=film_id_val,
                        film_slug=film_slug,
                        cache_busting_key=cache_key,
                    )
                )
        else:
            # 2) Legacy markup fallback
            film_containers = soup.find_all("li", class_="poster-container")
            for container in film_containers:
                poster_div = container.find("div", class_=re.compile(r"film-poster"))
                if not poster_div:
                    continue

                film_slug = poster_div.get("data-film-slug", "")
                if not film_slug:
                    continue

                img = poster_div.find("img")
                # Prefer original title with year when available
                title_oy = poster_div.get("data-original-title") or (img.get("data-original-title") if img else None)
                title = (
                    title_oy
                    if title_oy
                    else (img.get("alt") if img else extract_title_from_slug(film_slug))
                )

                image_url = None
                poster_url = poster_div.get("data-poster-url")
                if poster_url:
                    image_url = f"https://letterboxd.com{poster_url}"
                elif img:
                    image_url = img.get("data-src") or img.get("src")
                    if image_url and "empty-poster" in image_url:
                        image_url = None

                movies.append(
                    Movie(
                        title=title,
                        url=f"https://letterboxd.com/film/{film_slug}/",
                        image_url=image_url,
                        cached_image=None,
                    )
                )

        print(f"Found {len(movies)} movies on page {page}", file=sys.stderr)

        # Check if there's a next page (present in both markups)
        pagination = soup.find("div", class_="pagination")
        has_next = bool(pagination and pagination.find("a", class_="next"))

        return movies, has_next

    except requests.RequestException as e:
        print(f"Error fetching page {page}: {e}", file=sys.stderr)
        return [], False


def get_image_filename(movie_title: str, image_url: str) -> str:
    """Generate a filename for the cached image based on movie title"""
    # Sanitize title for filename
    safe_title = re.sub(r'[^\w\s-]', '', movie_title.lower())
    safe_title = re.sub(r'[-\s]+', '-', safe_title).strip('-')
    
    # Try to extract file extension
    extension = ".jpg"  # default
    if "." in image_url:
        ext = image_url.split(".")[-1].split("?")[0].lower()
        if ext in ["jpg", "jpeg", "png", "webp"]:
            extension = f".{ext}"
    return f"{safe_title}{extension}"


"""Utilities for resolving Letterboxd poster URLs via headless browser only."""


class HeadlessPosterResolver:
    """Resolve the poster URL via the film page and do a simple size swap.

    - Find the `<img>` whose alt starts with "Poster for" (the correct poster).
    - Read its src/srcset/currentSrc and perform a simple string replacement:
      `-0-230-0-345-` -> `-0-2000-0-3000-` (query string preserved).
    - Always return the rewritten URL; downloading uses that exact URL.
    """

    def __init__(self, user_agent: str | None = None) -> None:
        if not sync_playwright:
            raise RuntimeError("playwright is not installed. Install browsers with: uvx playwright install chromium")
        self._play = sync_playwright().start()
        self._browser: Browser = self._play.chromium.launch(headless=True)
        context_args = {"viewport": {"width": 1280, "height": 1000}}
        if user_agent:
            context_args["user_agent"] = user_agent
        self._context = self._browser.new_context(**context_args)
        self._page: Page | None = None

    def _page_obj(self) -> Page:
        if self._page is None:
            self._page = self._context.new_page()
        return self._page

    def close(self) -> None:
        try:
            if self._page:
                self._page.close()
            self._context.close()
            self._browser.close()
        finally:
            self._play.stop()

    def _pick_src_from_img(self, page: Page, selector: str) -> str | None:
        # Prefer currentSrc, then srcset last candidate, then src
        js = """
            sel => {
                const el = document.querySelector(sel);
                if (!el) return null;
                // prefer currentSrc
                if (el.currentSrc && !el.currentSrc.includes('empty-poster')) return el.currentSrc;
                const ss = el.getAttribute('srcset');
                if (ss) {
                    const parts = ss.split(',').map(s => s.trim()).filter(Boolean);
                    if (parts.length) {
                        const last = parts[parts.length - 1].split(/\s+/)[0];
                        if (last && !last.includes('empty-poster')) return last;
                    }
                }
                const s = el.getAttribute('src') || el.getAttribute('data-src');
                if (s && !s.includes('empty-poster')) return s;
                return null;
            }
        """
        try:
            return page.eval_on_selector(selector, js)
        except Exception:
            return None

    def _rewrite_hi_res(self, url: str) -> str | None:
        """Stupid replacement: turn -0-230-0-345- into -0-2000-0-3000- (preserve query).

        Returns the rewritten URL string or None if no 230/345 pattern found.
        """
        # Keep query (?v=...) if present
        base, qs = (url.split("?", 1) + [""])[:2]
        replaced = base.replace("-0-230-", "-0-2000-").replace("-0-345-", "-0-3000-")
        if replaced == base:
            return None
        return replaced + ("?" + qs if qs else "")

    def _scan_for_poster_src(self, page: Page) -> str | None:
        """Select the film poster by alt text only: `img[alt^="Poster for"]`.

        Rules:
        - Only consider images whose alt starts with 'Poster for'
        - Exclude any 'empty-poster' placeholders
        - Return a Letterboxd CDN resized path (sm/upload or film-poster) if present
        """
        js = """
            () => {
                const pickSrc = (el) => {
                    if (!el) return null;
                    if (el.currentSrc && !el.currentSrc.includes('empty-poster')) return el.currentSrc;
                    const ss = el.getAttribute('srcset');
                    if (ss) {
                        const parts = ss.split(',').map(s => s.trim()).filter(Boolean);
                        if (parts.length) {
                            const last = parts[parts.length - 1].split(/\s+/)[0];
                            if (last && !last.includes('empty-poster')) return last;
                        }
                    }
                    const s = el.getAttribute('src') || el.getAttribute('data-src');
                    if (s && !s.includes('empty-poster')) return s;
                    return null;
                };

                const isLbxCdn = (u) => typeof u === 'string' && /https?:\/\/a\.ltrbxd\.com\/resized\/(?:sm\/upload|film-poster)\//.test(u);

                // Only consider images explicitly marked as posters by alt text
                const candidates = Array.from(document.querySelectorAll('img[alt^="Poster for"]'));
                for (const el of candidates) {
                    const cand = pickSrc(el);
                    // Prefer Letterboxd CDN poster URLs where we can rewrite sizes
                    if (isLbxCdn(cand)) return cand;
                }
                // If none match CDN, return the first valid poster-for src (even if not rewritable)
                for (const el of candidates) {
                    const cand = pickSrc(el);
                    if (cand) return cand;
                }
                return null;
            }
        """
        try:
            return page.evaluate(js)
        except Exception:
            return None

    def resolve(self, film_slug: str) -> str | None:
        page = self._page_obj()
        url = f"https://letterboxd.com/film/{film_slug}/"
        # Log the page we're about to visit
        print(f"➡️  Visiting film page: {url}", file=sys.stderr)
        page.goto(url, wait_until="networkidle", timeout=40000)
        # Log the final loaded URL (after any redirects/canonicalization)
        try:
            print(f"   Loaded: {page.url}", file=sys.stderr)
        except Exception:
            pass
        # (Debug print of all <img> tags removed by request)
        # Only look for the explicit 'Poster for …' image on the page.
        scanned = self._scan_for_poster_src(page)
        if scanned:
            print(f"   Found poster src: {scanned}", file=sys.stderr)
            rewritten = self._rewrite_hi_res(scanned)
            if not rewritten:
                print("   ✗ Could not rewrite poster src to 2000x3000 (no 230/345 found)", file=sys.stderr)
                raise RuntimeError("Rewrite failed: no 230/345 pattern found")
            print(f"   Rewritten poster src: {rewritten}", file=sys.stderr)
            # Always return the rewritten URL; downloading uses this exact URL
            return rewritten
        # If we couldn't read a src via 'Poster for' alt image, fail
        raise RuntimeError(f"Poster image src not found via 'Poster for' alt on page {url}")


## No non-headless fallback logic below — headless is required.


def download_image(movie: Movie, cache_dir: Path, resolver: HeadlessPosterResolver | None = None) -> str | None:
    """Download an image and cache it. Images are the only cached data."""
    movie_title = movie["title"]
    
    # Extract film slug and id
    film_slug = (movie.get("film_slug") or movie["url"].rstrip("/").split("/")[-1])
    film_id = movie.get("film_id")
    cache_key = movie.get("cache_busting_key")
    
    # Headless-only: derive poster from the film page image
    if resolver is None:
        print("❌ Headless resolver is required (Playwright). Aborting poster download.", file=sys.stderr)
        return None
    real_image_url: str | None = None
    try:
        real_image_url = resolver.resolve(film_slug)
    except Exception as e:
        print(f"Headless poster resolve failed for {film_slug}: {e}", file=sys.stderr)
        real_image_url = None
    
    if not real_image_url:
        return None
    
    # Use slug-based filename for stability
    extension = ".jpg"
    if "." in real_image_url.split("?")[0]:
        ext = real_image_url.split("?")[0].split(".")[-1].lower()
        if ext in ["jpg", "jpeg", "png", "webp"]:
            extension = f".{ext}"
    filename = f"{film_slug}{extension}"
    cache_path = cache_dir / filename
    
    # Skip if already cached
    if cache_path.exists():
        # Check if it's actually an image file and not HTML
        try:
            with open(cache_path, 'rb') as f:
                header = f.read(10)
                # Check for common image file signatures
                if not (header.startswith(b'\xff\xd8') or  # JPEG
                        header.startswith(b'\x89PNG') or   # PNG
                        header[:4] == b'RIFF' or           # WebP
                        header[:4] == b'GIF8'):            # GIF
                    print(f"  ! Removing invalid image file: {filename}", file=sys.stderr)
                    cache_path.unlink()
                else:
                    return filename
        except Exception:
            pass
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            "Referer": "https://letterboxd.com/",
        }
        
        print(f"   Downloading from: {real_image_url}", file=sys.stderr)
        response = requests.get(real_image_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Verify it's actually an image
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            print(f"Warning: Content type {content_type} for {movie_title}", file=sys.stderr)
            return None
        
        # Save the image
        cache_path.write_bytes(response.content)
        print(f"  ✓ Downloaded poster for {movie_title}", file=sys.stderr)
        return filename
        
    except requests.RequestException as e:
        print(f"Error downloading image for {movie_title}: {e}", file=sys.stderr)
        return None


def fetch_all_movies(username: str = "icepuma", max_pages: int = 20) -> list[Movie]:
    """Fetch all movies from all pages"""
    all_movies = []
    
    for page in range(1, max_pages + 1):
        print(f"\nFetching page {page}...", file=sys.stderr)
        movies, has_next = fetch_letterboxd_page(username, page)
        
        if not movies:
            break
            
        all_movies.extend(movies)
        print(f"Total movies so far: {len(all_movies)}", file=sys.stderr)
        
        if not has_next:
            break
            
        time.sleep(0.5)  # Be nice to the server
    
    return all_movies


def create_movie_slug(title: str) -> str:
    """Create a URL-safe slug from movie title"""
    # Remove special characters and normalize
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    # Replace spaces and multiple hyphens with single hyphen
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')


def load_existing_movies(content_dir: Path) -> dict[str, dict]:
    """Load existing movies from content collection"""
    existing_movies = {}
    for json_file in content_dir.glob("*.json"):
        try:
            data = json.loads(json_file.read_text())
            existing_movies[data["title"]] = data
        except (json.JSONDecodeError, KeyError):
            pass
    return existing_movies


def main():
    """Main function"""
    print("🎬 Fetching movies from Letterboxd...", file=sys.stderr)
    
    # Set up content collection directory
    content_dir = Path("src/content/movies")
    content_dir.mkdir(parents=True, exist_ok=True)
    
    # Load existing movies (for comparison, not caching)
    existing_movies = load_existing_movies(content_dir)
    print(f"📚 Found {len(existing_movies)} existing movies", file=sys.stderr)
    
    # Always fetch fresh movie data from Letterboxd
    # Images will still be cached and reused
    force_refresh = "--force" in sys.argv
    
    movies = fetch_all_movies()
    
    if not movies:
        print("❌ No movies found!", file=sys.stderr)
        sys.exit(1)
    
    # Remove duplicates and sort
    unique_movies = list({movie["title"]: movie for movie in movies}.values())
    unique_movies.sort(key=lambda m: m["title"].lower())
    
    # No longer tracking last fetch timestamp since we always fetch fresh data
    
    print(f"\n📁 Content collection directory: {content_dir}", file=sys.stderr)
    
    # Process movies
    print(f"\n🎬 Processing {len(unique_movies)} movies...", file=sys.stderr)
    downloaded_count = 0
    cached_count = 0
    new_movies_count = 0
    updated_movies_count = 0

    # Initialize headless resolver (required)
    resolver: HeadlessPosterResolver | None = None
    try:
        resolver = HeadlessPosterResolver(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
    except Exception as e:
        print(f"❌ Headless (Playwright) not available: {e}", file=sys.stderr)
        print("Please install browsers: `uvx playwright install chromium`", file=sys.stderr)
        sys.exit(2)

    
    for i, movie in enumerate(unique_movies):
        movie_slug = movie.get("film_slug") or create_movie_slug(movie["title"])
        movie_title = movie["title"]
        
        # Always update movie data (no caching of metadata)
        existing_movie = existing_movies.get(movie_title)
        needs_update = True
        
        # Download image if needed
        image_filename = f"{movie_slug}.jpg"
        image_path = content_dir / image_filename
        
        if not image_path.exists() or force_refresh:
            # Need to download the image
            cached_image = download_image(movie, content_dir, resolver=resolver)
            if cached_image:
                downloaded_count += 1
            else:
                print(f"❌ Failed to resolve poster via headless XPath for: {movie_title} ({movie_slug})", file=sys.stderr)
                sys.exit(3)
        else:
            # Image already exists
            cached_count += 1
            cached_image = image_filename
        
        # Create/update content entry if needed
        if needs_update and cached_image:
            movie_data = {
                "title": movie["title"],
                "letterboxdUrl": movie["url"],
                "poster": f"./{cached_image}",
                "slug": movie_slug
            }
            
            # Save as individual JSON file
            json_path = content_dir / f"{movie_slug}.json"
            json_path.write_text(json.dumps(movie_data, indent=2))
            
            if existing_movie:
                updated_movies_count += 1
            else:
                new_movies_count += 1
        
        # Progress indicator every 10 movies
        if (i + 1) % 10 == 0:
            print(f"  Processed {i + 1}/{len(unique_movies)} movies...", file=sys.stderr)
        
        # Add small delay only when downloading
        if downloaded_count > 0 and i % 5 == 0:
            time.sleep(0.5)
    
    # Clean up old movies that are no longer in the list
    current_slugs = {(movie.get("film_slug") or create_movie_slug(movie["title"])) for movie in unique_movies}
    removed_count = 0
    
    for json_file in content_dir.glob("*.json"):
        slug = json_file.stem
        if slug not in current_slugs:
            json_file.unlink()
            # Also remove the associated image
            image_file = content_dir / f"{slug}.jpg"
            if image_file.exists():
                image_file.unlink()
            removed_count += 1
    
    print(f"\n📊 Summary:", file=sys.stderr)
    print(f"  ✅ Downloaded {downloaded_count} new posters", file=sys.stderr)
    print(f"  📦 Reused {cached_count} cached posters", file=sys.stderr)
    print(f"  🆕 Added {new_movies_count} new movies", file=sys.stderr)
    print(f"  🔄 Updated {updated_movies_count} existing movies", file=sys.stderr)
    if removed_count > 0:
        print(f"  🗑️  Removed {removed_count} movies no longer in list", file=sys.stderr)
    
    # Also save a summary JSON for backward compatibility
    summary_file = Path("src/data/movies.json")
    summary_data = [
        {
            "title": movie["title"],
            "url": movie["url"],
            "slug": (movie.get("film_slug") or create_movie_slug(movie["title"]))
        }
        for movie in unique_movies
    ]
    summary_file.write_text(json.dumps(summary_data, indent="\t"))
    
    print(f"\n✅ Total {len(unique_movies)} movies in collection", file=sys.stderr)

    # Clean up headless
    try:
        if resolver:
            resolver.close()
    except Exception:
        pass

    # No headless resources to clean up
    
    if new_movies_count > 0:
        print("\n🆕 Recently added movies:", file=sys.stderr)
        # Show newly added movies
        new_movies = [m for m in unique_movies if m["title"] not in existing_movies]
        for movie in new_movies[:10]:
            print(f"  🖼️ {movie['title']}", file=sys.stderr)
        if len(new_movies) > 10:
            print(f"  ... and {len(new_movies) - 10} more", file=sys.stderr)


if __name__ == "__main__":
    if "--help" in sys.argv or "-h" in sys.argv:
        print("Fetch movies from Letterboxd and cache posters")
        print("\nUsage: python fetch-letterboxd-movies.py [options]")
        print("\nOptions:")
        print("  --force    Force re-download all images")
        print("  --help     Show this help message")
        print("\nImages are cached and reused. Movie data is always fetched fresh.")
        sys.exit(0)
    
    main()
