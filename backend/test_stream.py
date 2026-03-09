import requests, json, time

print("Waiting for server reload...")
time.sleep(3)

search = requests.get("http://localhost:8000/api/search?q=inception", timeout=15).json()
if search.get("results"):
    movie_id = search["results"][0]["id"]
    title = search["results"][0]["title"]
    print(f"Testing with: {title} (ID: {movie_id})")

    stream = requests.get(f"http://localhost:8000/api/movie/{movie_id}/stream", timeout=30).json()
    links = stream.get("links", [])
    subs = stream.get("subtitles", [])
    print(f"Links: {len(links)}, Subtitles: {len(subs)}")

    if links:
        proxy_url = links[0]["url"]
        print("Proxy URL:", proxy_url[:100])
        r = requests.get(proxy_url, headers={"Range": "bytes=0-1023"}, timeout=20)
        print("Video stream status:", r.status_code)
        ct = r.headers.get("content-type", "?")
        print("Content-Type:", ct)

    if subs:
        sub_url = subs[0]["url"]
        r2 = requests.get(sub_url, timeout=15)
        print("Subtitle stream status:", r2.status_code)
else:
    print("No search results")
