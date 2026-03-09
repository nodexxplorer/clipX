import requests
import json

try:
    res = requests.post(
        'http://localhost:8000/graphql',
        json={'query': 'mutation { login(email: "mfonidivinewill@gmail.com", password: "fortune@2003") { token } }'}
    )
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
