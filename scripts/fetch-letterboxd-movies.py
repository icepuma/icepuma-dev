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
from typing import TypedDict

import requests
from bs4 import BeautifulSoup


class Movie(TypedDict):
    title: str
    url: str


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
            
            movies.append(Movie(
                title=title,
                url=f"https://letterboxd.com/film/{film_slug}/"
            ))
        
        # Check if there's a next page
        pagination = soup.find("div", class_="pagination")
        has_next = bool(pagination and pagination.find("a", class_="next"))
        
        return movies, has_next
        
    except requests.RequestException as e:
        print(f"Error fetching page {page}: {e}", file=sys.stderr)
        return [], False


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


def main():
    """Main function"""
    print("🎬 Fetching movies from Letterboxd...", file=sys.stderr)
    
    movies = fetch_all_movies()
    
    if not movies:
        print("❌ No movies found!", file=sys.stderr)
        sys.exit(1)
    
    # Remove duplicates and sort
    unique_movies = list({movie["title"]: movie for movie in movies}.values())
    unique_movies.sort(key=lambda m: m["title"].lower())
    
    # Save to JSON file
    output_file = Path("src/data/movies.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(unique_movies, indent="\t"))
    
    print(f"\n✅ Fetched {len(unique_movies)} movies and saved to {output_file}", file=sys.stderr)
    print("\n📊 Recent movies:", file=sys.stderr)
    for movie in unique_movies[:10]:
        print(f"  • {movie['title']}", file=sys.stderr)


if __name__ == "__main__":
    main()