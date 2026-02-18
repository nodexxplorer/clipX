# ClipX Backend (FastAPI Rebuild)

This is a production-grade FastAPI backend for the ClipX movie streaming site, wrapping the `moviebox-api` library.

## Project Structure

- `app/main.py`: Entry point for the FastAPI application.
- `app/api/routes/`: API endpoint definitions.
- `app/services/`: Business logic and raw data mapping.
- `app/providers/`: Data provider wrappers (Moviebox).
- `app/models/`: Pydantic models for API responses.
- `app/core/`: Configuration and global settings.

## Getting Started

### Prerequisites

- Python 3.10+
- Installed dependencies from `requirements.txt`

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables in `.env`:
   ```env
   MOVIEBOX_API_HOST=h5.aoneroom.com
   ```

### Running Locally

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Swagger documentation: `http://localhost:8000/docs`.

## API Endpoints

### Movies & Series
- `GET /api/search?q=<query>&page=<number>`
- `GET /api/trending`: Popular content.
- `GET /api/latest`: Latest movies.
- `GET /api/movie/{id}`: Detailed information.
- `GET /api/movie/{id}/stream`: Playback URLs.
- `GET /api/movie/{id}/download`: Download links & subtitles.

### Genres
- `GET /api/genres`: List available genres.
- `GET /api/genre/{name}`: Filter content by genre.
