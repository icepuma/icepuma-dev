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

import json
import re
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup


def extract_title_from_slug(film_slug: str) -> str:
    """Extract title from film slug like 'novocaine-2025' or 'the-lobster-2015'"""
    # Remove year if present at the end
    slug_without_year = re.sub(r'-\d{4}$', '', film_slug)
    # Convert slug to title case
    title = slug_without_year.replace('-', ' ').title()
    return title


def fetch_letterboxd_page(username: str, page: int = 1) -> tuple[list[dict], bool]:
    """Fetch a single page of movies from Letterboxd
    
    Returns: (movies_list, has_next_page)
    """
    if page == 1:
        url = f"https://letterboxd.com/{username}/films/"
    else:
        url = f"https://letterboxd.com/{username}/films/page/{page}/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
            
            # Get film slug
            film_slug = poster_div.get("data-film-slug", "")
            if not film_slug:
                continue
            
            # Extract title from slug
            title = extract_title_from_slug(film_slug)
            
            # Get more accurate title from image alt text if available
            img = poster_div.find("img")
            if img and img.get("alt"):
                title = img["alt"]
            
            # Build Letterboxd URL
            film_url = f"https://letterboxd.com/film/{film_slug}/"
            
            movie_data = {
                "title": title,
                "url": film_url
            }
            
            movies.append(movie_data)
        
        # Check if there's a next page
        pagination = soup.find("div", class_="pagination")
        has_next = bool(pagination and pagination.find("a", class_="next"))
        
        return movies, has_next
        
    except requests.RequestException as e:
        print(f"Error fetching page {page}: {e}", file=sys.stderr)
        return [], False


def fetch_all_movies(username: str = "icepuma") -> list[dict]:
    """Fetch all movies from all pages"""
    all_movies = []
    page = 1
    
    while True:
        print(f"\nFetching page {page}...", file=sys.stderr)
        movies, has_next = fetch_letterboxd_page(username, page)
        
        if movies:
            all_movies.extend(movies)
            print(f"Total movies so far: {len(all_movies)}", file=sys.stderr)
        
        if not movies or not has_next:
            break
            
        page += 1
        
        # Be nice to the server
        time.sleep(0.5)
        
        # Safety limit
        if page > 20:
            print("Reached page limit", file=sys.stderr)
            break
    
    return all_movies


def main():
    """Main function"""
    print("🎬 Fetching movies from Letterboxd...", file=sys.stderr)
    
    movies = fetch_all_movies()
    
    if not movies:
        print("❌ No movies found!", file=sys.stderr)
        sys.exit(1)
    
    # Remove duplicates (keep first occurrence)
    seen = set()
    unique_movies = []
    for movie in movies:
        key = movie["title"]
        if key not in seen:
            seen.add(key)
            unique_movies.append(movie)
    
    # Sort movies alphanumerically by title
    unique_movies.sort(key=lambda movie: movie["title"].lower())
    
    # Save to JSON file
    output_file = Path("src/data/movies.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, "w") as f:
        json.dump(unique_movies, f, indent="\t")
    
    print(f"\n✅ Fetched {len(unique_movies)} movies and saved to {output_file}", file=sys.stderr)
    
    # Show summary of recent movies
    print("\n📊 Recent movies:", file=sys.stderr)
    for movie in unique_movies[:10]:
        print(f"  • {movie['title']}", file=sys.stderr)


if __name__ == "__main__":
    main()