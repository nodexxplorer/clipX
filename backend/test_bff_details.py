import asyncio
import json
from moviebox_api.requests import Session
from moviebox_api.helpers import get_absolute_url

async def test_endpoint(endpoint, params):
    session = Session()
    url = get_absolute_url(endpoint)
    print(f"Testing {url} with {params}")
    try:
        # get_with_cookies_from_api handles the 'data' field extraction and json parsing
        res = await session.get_with_cookies_from_api(url=url, params=params)
        print("SUCCESS!")
        print(json.dumps(res, indent=2)[:1000])
    except Exception as e:
        print(f"FAILED: {e}")

async def main():
    # ID for "All American"
    mid = '1167223938976469784'
    
    endpoints = [
        ("/wefeed-h5-bff/web/subject/detail", {"subjectId": mid}),
        ("/wefeed-h5-bff/web/subject/info", {"subjectId": mid}),
        ("/wefeed-h5-bff/web/subject/common-detail", {"subjectId": mid}),
    ]
    
    for ep, p in endpoints:
        await test_endpoint(ep, p)
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
