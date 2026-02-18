import requests

def test_trending():
    query = """
    query {
      trending(limit: 20) {
        id
        title
      }
    }
    """
    try:
        url = "http://localhost:8000/graphql"
        response = requests.post(url, json={'query': query})
        data = response.json()
        print("Trending IDs:")
        for movie in data['data']['trending']:
            print(f"ID: {movie['id']} | Title: {movie['title']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_trending()
