import requests

def test_search():
    query = """
    query {
      searchMovies(query: "The Bad Guys") {
        items {
          id
          title
        }
      }
    }
    """
    try:
        url = "http://localhost:8000/graphql"
        response = requests.post(url, json={'query': query})
        data = response.json()
        print("Search results from GraphQL:")
        for movie in data['data']['searchMovies']['items']:
            print(f"ID: {movie['id']} | Title: {movie['title']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_search()
