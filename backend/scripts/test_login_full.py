import requests
import json
import sys

query = """
mutation {
  login(email: "mfonidivinewill@gmail.com", password: "fortune@2003") {
    token
    user {
      id
      email
      name
      avatar
      role
      createdAt
      preferences {
        favoriteGenres
        theme
      }
    }
  }
}
"""

try:
    res = requests.post(
        'http://localhost:8000/graphql',
        json={'query': query}
    )
    print("Status:", res.status_code)
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
