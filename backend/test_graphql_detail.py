import requests

def test_movie_detail(mid):
    query = """
    query GetMovie($id: ID!) {
      movie(id: $id) {
        id
        title
        overview
      }
    }
    """
    try:
        url = "http://localhost:8000/graphql"
        response = requests.post(url, json={'query': query, 'variables': {'id': mid}})
        data = response.json()
        print(f"Detail for ID {mid}:")
        print(data)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import sys
    mid = sys.argv[1] if len(sys.argv) > 1 else '621107'
    test_movie_detail(mid)
