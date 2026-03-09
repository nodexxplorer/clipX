import asyncio
import httpx
from app.services.movie_service import movie_service

# ID from the user's screenshot URL: localhost:3000/watch/7466904442...
# Let's try to extract a likely ID or just search for "Mufasa" to get a fresh ID.
# Actually, I'll search first to be sure.

async def main():
    print("Searching for 'Mufasa' to get a valid ID...")
    search_results = await movie_service.search_content("Mufasa")
    if not search_results.results:
        print("Mufasa not found, trying 'The Boys' for series test.")
        search_results = await movie_service.search_content("The Boys")
    
    if not search_results.results:
        print("No content found.")
        return

    item = search_results.results[0]
    print(f"Testing with Item: {item.title} (ID: {item.id}, Type: {item.type})")

    # Test Stream Links
    print(f"\n--- Fetching Stream Links for {item.title} ---")
    # For movies, season=0, episode=0 ideally, but let's see what the service does with defaults
    stream_response = await movie_service.get_stream_links(item.id, season=1, episode=1)
    
    if stream_response.links:
        print(f"Found {len(stream_response.links)} stream links.")
        for link in stream_response.links:
            print(f"Quality: {link.quality}")
            print(f"URL: {link.url}")
            
            # Test connectivity
            print("  Testing connectivity...")
            try:
                async with httpx.AsyncClient() as client:
                    # Try with no headers
                    resp = await client.head(link.url, follow_redirects=True, timeout=5.0)
                    print(f"  HEAD (no headers): {resp.status_code}")
                    
                    # Try with referrer if failed
                    if resp.status_code != 200:
                         headers = {"Referer": "https://fmoviesunblocked.net/"} # From constants.py
                         resp = await client.head(link.url, headers=headers, follow_redirects=True, timeout=5.0)
                         print(f"  HEAD (with Referer): {resp.status_code}")
            except Exception as e:
                print(f"  Connection failed: {e}")
    else:
        print("No stream links found.")

    # Test Download Links
    print(f"\n--- Fetching Download Links for {item.title} ---")
    download_response = await movie_service.get_download_links(item.id, season=1, episode=1)
    
    if download_response.links:
        print(f"Found {len(download_response.links)} download links.")
        for link in download_response.links:
            print(f"Quality: {link.quality}")
            print(f"URL: {link.url}")
             # Test connectivity
            print("  Testing connectivity...")
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.head(link.url, follow_redirects=True, timeout=5.0)
                    print(f"  HEAD (no headers): {resp.status_code}")
                if resp.status_code != 200:
                     # Try with official referer
                     headers = {"Referer": "https://fmoviesunblocked.net/"}
                     resp = await client.head(link.url, headers=headers, follow_redirects=True, timeout=5.0)
                     print(f"  HEAD (with Official Referer): {resp.status_code}")
                     
                     # Try with localhost referer
                     headers_local = {"Referer": "http://localhost:3000/"}
                     resp_local = await client.head(link.url, headers=headers_local, follow_redirects=True, timeout=5.0)
                     print(f"  HEAD (with Localhost Referer): {resp_local.status_code}")
            except Exception as e:
                print(f"  Connection failed: {e}")
    else:
        print("No download links found.")

if __name__ == "__main__":
    asyncio.run(main())
