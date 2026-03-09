import httpx
import asyncio

async def main():
    query = """
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        user {
          id
          email
          role
        }
      }
    }
    """
    
    variables = {
        "email": "mfonidivinewill@gmail.com",
        "password": "fortune@2003"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/graphql",
            json={"query": query, "variables": variables}
        )
        print("Status code:", response.status_code)
        print("Response JSON:", response.json())

if __name__ == "__main__":
    asyncio.run(main())
