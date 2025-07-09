#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "beautifulsoup4",
#   "requests",
#   "lxml",
# ]
# ///

"""Fetch movies from Letterboxd and update movies.json"""

import hashlib
import json
import re
import sys
import time
from pathlib import Path
from typing import TypedDict

import requests
from bs4 import BeautifulSoup


class Movie(TypedDict):
    title: str
    url: str
    image_url: str | None
    cached_image: str | None


def extract_title_from_slug(film_slug: str) -> str:
    """Extract title from film slug like 'novocaine-2025' or 'the-lobster-2015'"""
    slug_without_year = re.sub(r'-\d{4}$', '', film_slug)
    return slug_without_year.replace('-', ' ').title()


def fetch_letterboxd_page(username: str, page: int = 1) -> tuple[list[Movie], bool]:
    """Fetch a single page of movies from Letterboxd. Returns (movies_list, has_next_page)"""
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
        movies = []
        
        # Find all film poster containers
        film_containers = soup.find_all("li", class_="poster-container")
        
        print(f"Found {len(film_containers)} movies on page {page}", file=sys.stderr)
        
        for container in film_containers:
            # Find the poster div with film data
            poster_div = container.find("div", class_=re.compile(r"film-poster"))
            if not poster_div:
                continue
            
            film_slug = poster_div.get("data-film-slug", "")
            if not film_slug:
                continue
            
            # Get title from image alt text or extract from slug
            img = poster_div.find("img")
            title = img.get("alt") if img else extract_title_from_slug(film_slug)
            
            # Extract image URL
            image_url = None
            
            # Try to get the poster URL from data-poster-url attribute
            poster_url = poster_div.get("data-poster-url")
            if poster_url:
                # Convert relative URL to absolute URL
                image_url = f"https://letterboxd.com{poster_url}"
            elif img:
                # Fallback to img src if data-poster-url not found
                image_url = img.get("data-src") or img.get("src")
                # Skip placeholder images
                if image_url and "empty-poster" in image_url:
                    image_url = None
            
            movies.append(Movie(
                title=title,
                url=f"https://letterboxd.com/film/{film_slug}/",
                image_url=image_url,
                cached_image=None
            ))
        
        # Check if there's a next page
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


def get_film_poster_url(film_slug: str) -> str | None:
    """Get the actual poster image URL via the AJAX endpoint"""
    try:
        # Use the poster AJAX endpoint
        poster_url = f"https://letterboxd.com/ajax/poster/film/{film_slug}/std/230x345/"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer": f"https://letterboxd.com/film/{film_slug}/",
        }
        
        response = requests.get(poster_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "lxml")
        
        # Find the poster image
        img = soup.find("img", class_="image")
        if img and not "-empty-poster-" in img.get("class", []):
            # Get the high-res version from srcset if available
            srcset = img.get("srcset")
            if srcset:
                # Extract the 2x URL from srcset
                urls = srcset.split()
                for i, part in enumerate(urls):
                    if part.endswith("2x") and i > 0:
                        return urls[i-1]
            
            # Fallback to regular src
            src = img.get("src")
            if src and "empty-poster" not in src:
                return src
        
        return None
        
    except requests.RequestException as e:
        print(f"Error fetching poster for {film_slug}: {e}", file=sys.stderr)
        return None


def download_image(movie: Movie, cache_dir: Path) -> str | None:
    """Download an image and save it to the cache directory"""
    movie_title = movie["title"]
    
    # Extract film slug from URL
    film_slug = movie["url"].rstrip("/").split("/")[-1]
    
    # Get the actual poster URL via AJAX endpoint
    real_image_url = get_film_poster_url(film_slug)
    
    if not real_image_url:
        return None
    
    filename = get_image_filename(movie_title, real_image_url)
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
    
    # Load existing movies
    existing_movies = load_existing_movies(content_dir)
    print(f"📚 Found {len(existing_movies)} existing movies in cache", file=sys.stderr)
    
    # Check if we need to fetch new data
    force_refresh = "--force" in sys.argv
    if not force_refresh and existing_movies:
        # Check if we fetched recently (within last month)
        cache_file = content_dir / ".last_fetch"
        if cache_file.exists():
            last_fetch = cache_file.stat().st_mtime
            days_old = (time.time() - last_fetch) / 86400
            if days_old < 30:  # 30 days
                print(f"✅ Using cached data ({days_old:.0f} days old). Use --force to refresh.", file=sys.stderr)
                return
    
    movies = fetch_all_movies()
    
    if not movies:
        print("❌ No movies found!", file=sys.stderr)
        sys.exit(1)
    
    # Remove duplicates and sort
    unique_movies = list({movie["title"]: movie for movie in movies}.values())
    unique_movies.sort(key=lambda m: m["title"].lower())
    
    # Update last fetch timestamp
    cache_file = content_dir / ".last_fetch"
    cache_file.touch()
    
    print(f"\n📁 Content collection directory: {content_dir}", file=sys.stderr)
    
    # Process movies
    print(f"\n🎬 Processing {len(unique_movies)} movies...", file=sys.stderr)
    downloaded_count = 0
    cached_count = 0
    new_movies_count = 0
    updated_movies_count = 0
    
    for i, movie in enumerate(unique_movies):
        movie_slug = create_movie_slug(movie["title"])
        movie_title = movie["title"]
        
        # Check if movie data needs updating
        existing_movie = existing_movies.get(movie_title)
        needs_update = (
            not existing_movie or 
            existing_movie.get("letterboxdUrl") != movie["url"] or
            force_refresh
        )
        
        # Download image if needed
        image_filename = f"{movie_slug}.jpg"
        image_path = content_dir / image_filename
        
        if not image_path.exists():
            # Need to download the image
            cached_image = download_image(movie, content_dir)
            if cached_image:
                downloaded_count += 1
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
    current_slugs = {create_movie_slug(movie["title"]) for movie in unique_movies}
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
    print(f"  📦 {cached_count} posters already cached", file=sys.stderr)
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
            "slug": create_movie_slug(movie["title"])
        }
        for movie in unique_movies
    ]
    summary_file.write_text(json.dumps(summary_data, indent="\t"))
    
    print(f"\n✅ Total {len(unique_movies)} movies in collection", file=sys.stderr)
    
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
        print("  --force    Force refresh all data (ignore 30-day cache)")
        print("  --help     Show this help message")
        print("\nBy default, the script uses cached data if less than 30 days old.")
        sys.exit(0)
    
    main()