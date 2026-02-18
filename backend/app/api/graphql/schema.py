import strawberry
import asyncio
from typing import List, Optional, Any
from app.services.movie_service import movie_service
from app.core.auth import verify_password, get_password_hash, create_access_token
from app.models.database import User as DbUser, Watchlist as DbWatchlist
from sqlalchemy.future import select
import os
from datetime import datetime
from google.oauth2 import id_token
from google.auth.transport import requests

@strawberry.type
class UserPreferences:
    favoriteGenres: List[str] = strawberry.field(default_factory=list)
    theme: str = "dark"
    emailNotifications: bool = True
    autoPlayTrailers: bool = True

@strawberry.input
class UserPreferencesInput:
    theme: Optional[str] = "dark"
    emailNotifications: Optional[bool] = True
    autoPlayTrailers: Optional[bool] = True

@strawberry.type
class UserStats:
    id: strawberry.ID = "1"
    moviesWatched: int = 0
    totalWatchTime: int = 0
    reviewsWritten: int = 0
    watchlistCount: int = 0

@strawberry.type
class User:
    id: strawberry.ID
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: str = "user"
    createdAt: str = strawberry.field(resolver=lambda self: str(datetime.now()))
    preferences: UserPreferences = strawberry.field(default_factory=UserPreferences)
    stats: UserStats = strawberry.field(default_factory=UserStats)

@strawberry.type
class SuccessResponse:
    success: bool
    message: Optional[str] = None

@strawberry.type
class AuthResponse:
    token: str
    user: User

@strawberry.type
class GoogleAuthResponse:
    token: str
    user: User
    isNewUser: bool

@strawberry.type
class Genre:
    id: strawberry.ID
    name: str
    slug: str
    movieCount: int = 0

@strawberry.type
class CastMember:
    id: strawberry.ID
    name: str
    character: str
    profileImage: Optional[str]

@strawberry.type
class Movie:
    id: strawberry.ID
    title: str
    overview: Optional[str] = None
    posterPath: Optional[str] = None
    posterUrl: Optional[str] = strawberry.field(resolver=lambda self: self.posterPath)
    backdropPath: Optional[str] = None
    backdropUrl: Optional[str] = strawberry.field(resolver=lambda self: self.backdropPath)
    releaseDate: Optional[str] = None
    firstAirDate: Optional[str] = strawberry.field(resolver=lambda self: self.releaseDate)
    voteAverage: float = 0.0
    rating: float = strawberry.field(resolver=lambda self: self.voteAverage)
    voteCount: int = 0
    runtime: Optional[int] = None
    durationMinutes: Optional[int] = strawberry.field(resolver=lambda self: self.runtime)
    popularity: float = 0.0
    genres: Optional[List[Genre]] = None
    tagline: Optional[str] = None
    description: Optional[str] = strawberry.field(resolver=lambda self: self.overview)
    status: Optional[str] = None
    trailerUrl: Optional[str] = None
    inWatchlist: bool = False
    cast: Optional[List[CastMember]] = None
    recommendations: Optional[List["Movie"]] = None
    downloadCount: int = 0
    reason: Optional[str] = None
    score: float = 0.0
    editorNote: Optional[str] = None
    awards: Optional[str] = None
    
    @strawberry.field
    def year(self) -> Optional[int]:
        if not self.releaseDate:
            return None
        s_date = str(self.releaseDate).strip()
        if not s_date:
            return None
            
        try:
            # Handle "YYYY-MM-DD"
            if '-' in s_date:
                return int(s_date.split('-')[0])
            # Handle just "YYYY"
            return int(s_date[:4])
        except (ValueError, IndexError):
            return None

@strawberry.type
class MoviePagination:
    items: List[Movie]
    totalCount: int
    hasMore: bool
    currentPage: int

@strawberry.input
class MovieFilter:
    genre: Optional[str] = None
    year: Optional[int] = None
    minRating: Optional[float] = None

@strawberry.type
class BrowseMoviesResponse:
    movies: List[Movie]
    total: int
    hasMore: bool

@strawberry.input
class SeriesFilter:
    genre: Optional[str] = None
    year: Optional[int] = None
    minRating: Optional[float] = None

@strawberry.type
class BrowseSeriesResponse:
    series: List[Movie]
    total: int
    hasMore: bool

@strawberry.input
class RegisterInput:
    email: str
    password: str

@strawberry.input
class UpdateProfileInput:
    name: Optional[str] = None
    favoriteGenres: Optional[List[str]] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[UserPreferencesInput] = None

def get_user_preferences(user_db: DbUser) -> UserPreferences:
    prefs_data = user_db.preferences or {}
    return UserPreferences(
        favoriteGenres=prefs_data.get("favoriteGenres", []),
        theme=prefs_data.get("theme", "dark"),
        emailNotifications=prefs_data.get("emailNotifications", True),
        autoPlayTrailers=prefs_data.get("autoPlayTrailers", True)
    )

def create_user_response(user_db: DbUser) -> User:
    return User(
        id=str(user_db.id),
        email=user_db.email,
        name=user_db.name,
        avatar=user_db.avatar,
        bio=user_db.bio,
        role=user_db.role,
        preferences=get_user_preferences(user_db)
    )

@strawberry.type
class ContinueWatching:
    id: strawberry.ID
    movie: Movie
    currentTime: int
    duration: int

@strawberry.type
class RecentlyViewed:
    id: strawberry.ID
    title: str
    posterUrl: Optional[str]
    rating: float

@strawberry.type
class UserDashboardStats:
    moviesWatched: int = 0
    totalWatchTime: int = 0 # Minutes
    watchlistCount: int = 0
    reviewsWritten: int = 0

@strawberry.type
class DashboardData:
    watchlist: List[Movie]
    recentlyViewed: List[RecentlyViewed]
    continueWatching: List[ContinueWatching]
    stats: UserDashboardStats

@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info: strawberry.Info) -> Optional[User]:
        user = await info.context.user
        if not user:
            return None
        return create_user_response(user)

    @strawberry.field
    async def dashboardData(self, info: strawberry.Info) -> Optional[DashboardData]:
        user = await info.context.user
        if not user:
            return None
        
        db = await info.context.get_db()
        
        # 1. Fetch Watchlist
        # We need to fetch actual movie details for each watchlist item
        watchlist_query = await db.execute(select(DbWatchlist).where(DbWatchlist.user_id == user.id))
        watchlist_items = watchlist_query.scalars().all()
        
        watchlist_movies = []
        if watchlist_items:
             # Extract Moviebox IDs
            movie_ids = [item.moviebox_id for item in watchlist_items][:10] # Limit to 10 for dashboard
            
            # Fetch details concurrently
            tasks = [movie_service.get_details(mid) for mid in movie_ids]
            details_list = await asyncio.gather(*tasks)
            
            for details in details_list:
                if not details: continue
                watchlist_movies.append(Movie(
                     id=details.id,
                    title=details.title,
                    overview=details.description,
                    posterPath=details.poster_url,
                    backdropPath=details.poster_url,
                    releaseDate=str(details.year) if details.year else None,
                    voteAverage=details.rating or 0.0,
                    genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])],
                    runtime=details.duration or 0
                ))
        
        # 2. Mock Recently Viewed (Empty for now)
        recent = []
        
        # 3. Mock Continue Watching (Empty for now)
        continue_watching = []
        
        # 4. Stats
        stats = UserDashboardStats(
            watchlistCount=len(watchlist_items),
            moviesWatched=0,
            totalWatchTime=0,
            reviewsWritten=0
        )
        
        return DashboardData(
            watchlist=watchlist_movies,
            recentlyViewed=recent,
            continueWatching=continue_watching,
            stats=stats
        )

    @strawberry.field
    async def personalizedRecommendations(self, info: strawberry.Info, userId: Optional[strawberry.ID] = None, limit: Optional[int] = 10) -> List[Movie]:
        resp = await movie_service.get_trending()
        results = []
        for i, item in enumerate(resp.results[:limit]):
            results.append(Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else "AI-powered pick for you.",
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                reason="Top Choice" if i < 3 else "Trending Item",
                score=0.99 - (i * 0.01)
            ))
        return results

    @strawberry.field
    async def trending(self, limit: Optional[int] = 20, timeWindow: Optional[str] = "week") -> List[Movie]:
        resp = await movie_service.get_trending()
        return [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                voteCount=100,
                popularity=0.0
            ) for item in resp.results[:limit]
        ]
        
    @strawberry.field
    async def popular(self, limit: Optional[int] = 20, page: Optional[int] = 1) -> List[Movie]:
        # Reuse trending for now as Moviebox trending is actually popular
        return await self.trending(limit=limit)

    @strawberry.field
    async def trendingSeries(self, limit: Optional[int] = 10) -> List[Movie]:
        # Filter trending for series if possible, or just return top results
        resp = await movie_service.get_trending()
        return [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in resp.results if item.type == "series"
        ][:limit] or await self.trending(limit=limit)

    @strawberry.field
    async def featured(self, limit: Optional[int] = 5) -> List[Movie]:
        resp = await movie_service.get_trending()
        return [
            Movie(
                id=item.id,
                title=item.title,
                overview="Featured premium content on clipX.",
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                tagline="Staff Pick"
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def editorsChoice(self, limit: Optional[int] = 5) -> List[Movie]:
        resp = await movie_service.get_trending()
        return [
            Movie(
                id=item.id,
                title=item.title,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                editorNote="A must-watch masterpiece chosen by our experts."
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def awardWinning(self, limit: Optional[int] = 10) -> List[Movie]:
        resp = await movie_service.get_trending()
        # Mocking some award results by skipping some
        items = resp.results[5:5+limit] if len(resp.results) > 5 else resp.results[:limit]
        return [
            Movie(
                id=item.id,
                title=item.title,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                awards="Best Picture, Best Director"
            ) for item in items
        ]

    @strawberry.field
    async def movie(self, id: strawberry.ID) -> Optional[Movie]:
        details = await movie_service.get_details(str(id))
        if not details:
            return None
        return Movie(
            id=details.id,
            title=details.title,
            overview=details.description,
            posterPath=details.poster_url,
            backdropPath=details.poster_url,
            releaseDate=details.year,
            voteAverage=details.rating,
            voteCount=100,
            runtime=details.duration,
            trailerUrl=details.trailer_url,
            genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])]
        )

    @strawberry.field
    async def searchMovies(self, query: str, page: Optional[int] = 1, limit: Optional[int] = 24) -> MoviePagination:
        resp = await movie_service.search_content(query, page)
        items = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                voteCount=50
            ) for item in resp.results
        ]
        return MoviePagination(
            items=items,
            totalCount=100 if resp.has_more else len(items),
            hasMore=resp.has_more,
            currentPage=resp.page
        )

    @strawberry.field
    async def movies(self, filter: Optional[MovieFilter] = None, sort: Optional[str] = "popular", limit: Optional[int] = 20, offset: Optional[int] = 0) -> BrowseMoviesResponse:
        # For now, we reuse trending/search logic as moviebox doesn't have advanced filters
        # In a real app, this would use the database or a search engine
        resp = await movie_service.get_trending()
        
        # Simple simulation of filtering if filter is provided
        items = resp.results
        if filter:
            if filter.year:
                items = [i for i in items if i.year and str(filter.year) in i.year]
            if filter.minRating:
                items = [i for i in items if i.rating >= filter.minRating]
                
        movies_list = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in items
        ]
        
        # Handle offset/limit
        start = offset or 0
        end = start + (limit or 20)
        paged_movies = movies_list[start:end]
        
        return BrowseMoviesResponse(
            movies=paged_movies,
            total=len(movies_list),
            hasMore=len(movies_list) > end
        )

    @strawberry.field
    async def allSeries(self, filter: Optional[SeriesFilter] = None, sort: Optional[str] = "popular", limit: Optional[int] = 20, offset: Optional[int] = 0) -> BrowseSeriesResponse:
        resp = await movie_service.get_trending()
        
        # Filter for series
        items = [i for i in resp.results if i.type == "series"]
        
        # Fallback to general trending if no series found in top results
        if not items:
             # In a real app we'd call a specific series endpoint
             # For now let's just use trending as a base
             items = resp.results
        
        if filter:
            if filter.year:
                items = [i for i in items if i.year and str(filter.year) in i.year]
            if filter.minRating:
                items = [i for i in items if i.rating >= filter.minRating]
                
        series_list = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in items
        ]
        
        start = offset or 0
        end = start + (limit or 20)
        paged_series = series_list[start:end]
        
        return BrowseSeriesResponse(
            series=paged_series,
            total=len(series_list),
            hasMore=len(series_list) > end
        )

    @strawberry.field
    async def moviesByGenre(self, genreId: Optional[strawberry.ID] = None, genreSlug: Optional[str] = None, page: Optional[int] = 1, limit: Optional[int] = 20) -> MoviePagination:
        resp = await movie_service.get_trending()
        
        # Simple slug/name matching for backend
        target = genreSlug or genreId
        items = resp.results
        if target:
            # Moviebox results don't always have genre info in list view,
            # so we'd normally need to fetch more or use a specific endpoint.
            # For now let's just use trending as a base list
            pass
            
        movies_list = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in items
        ]
        
        start = ((page or 1) - 1) * (limit or 20)
        end = start + (limit or 20)
        paged_movies = movies_list[start:end]
        
        return MoviePagination(
            items=paged_movies,
            totalCount=len(movies_list),
            hasMore=len(movies_list) > end,
            currentPage=page or 1
        )

    @strawberry.field
    async def moviesByIds(self, ids: List[strawberry.ID]) -> List[Movie]:
        tasks = [movie_service.get_details(str(mid)) for mid in ids]
        details_list = await asyncio.gather(*tasks)
        results = []
        for details in details_list:
            if not details: continue
            results.append(Movie(
                id=details.id,
                title=details.title,
                overview=details.description,
                posterPath=details.poster_url,
                backdropPath=details.poster_url,
                releaseDate=details.year,
                voteAverage=details.rating,
                genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])]
            ))
        return results

    @strawberry.field
    async def streamingUrl(self, movieId: strawberry.ID) -> Optional[str]:
        try:
            links = await movie_service.get_stream_links(str(movieId))
            if links and links.links:
                # Prioritize higher quality, or just return first for now
                return links.links[0].url
            return None
        except Exception as e:
            print(f"Error fetching streaming URL: {e}")
            return None

    @strawberry.field
    async def genres(self) -> List[Genre]:
        genre_list = [
            "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Sci-Fi"
        ]
        return [Genre(id=str(i), name=g, slug=g.lower(), movieCount=100) for i, g in enumerate(genre_list)]

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def login(self, info: strawberry.Info, email: str, password: str) -> AuthResponse:
        db = await info.context.get_db()
        result = await db.execute(select(DbUser).where(DbUser.email == email))
        user = result.scalars().first()
        
        if not user or not verify_password(password, user.password):
            raise Exception("Invalid email or password")
            
        token = create_access_token({"sub": user.email})
        return AuthResponse(
            token=token,
            user=create_user_response(user)
        )

    @strawberry.mutation
    async def register(self, info: strawberry.Info, input: RegisterInput) -> AuthResponse:
        db = await info.context.get_db()
        result = await db.execute(select(DbUser).where(DbUser.email == input.email))
        if result.scalars().first():
            raise Exception("User already exists")
            
        hashed_password = get_password_hash(input.password)
        new_user = DbUser(
            email=input.email,
            password=hashed_password,
            role="user",
            preferences={}
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        token = create_access_token({"sub": new_user.email})
        return AuthResponse(
            token=token,
            user=create_user_response(new_user)
        )

    @strawberry.mutation
    async def googleAuth(self, info: strawberry.Info, idToken: str) -> GoogleAuthResponse:
        try:
            client_id = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "923142375396-2ervt54j93hat9deg7t4k621cmbvi3tt.apps.googleusercontent.com")
            idinfo = id_token.verify_oauth2_token(idToken, requests.Request(), client_id)
            
            email = idinfo['email']
            name = idinfo.get('name')
            avatar = idinfo.get('picture')
            
            db = await info.context.get_db()
            result = await db.execute(select(DbUser).where(DbUser.email == email))
            user = result.scalars().first()
            
            is_new_user = False
            if not user:
                user = DbUser(
                    email=email,
                    name=name,
                    avatar=avatar,
                    role="user",
                    preferences={}
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                is_new_user = True
            
            token = create_access_token({"sub": user.email})
            
            return GoogleAuthResponse(
                token=token,
                user=create_user_response(user),
                isNewUser=is_new_user
            )
        except Exception as e:
            print(f"Google auth error: {e}")
            raise Exception(f"Google authentication failed: {str(e)}")

    @strawberry.mutation
    async def updateProfile(self, info: strawberry.Info, input: UpdateProfileInput) -> User:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
            
        db = await info.context.get_db()
        if input.name:
            user.name = input.name
        if input.avatar:
            user.avatar = input.avatar
        if input.bio:
            user.bio = input.bio
        
        # Determine existing preferences
        current_prefs = dict(user.preferences) if user.preferences else {}
        
        if input.favoriteGenres is not None:
            current_prefs["favoriteGenres"] = input.favoriteGenres
            
        if input.preferences:
            if input.preferences.theme is not None:
                current_prefs["theme"] = input.preferences.theme
            if input.preferences.emailNotifications is not None:
                current_prefs["emailNotifications"] = input.preferences.emailNotifications
            if input.preferences.autoPlayTrailers is not None:
                current_prefs["autoPlayTrailers"] = input.preferences.autoPlayTrailers
        
        # Important: re-assign to trigger SQLalchemy update
        user.preferences = current_prefs
            
        await db.commit()
        await db.refresh(user)
        
        return create_user_response(user)

    @strawberry.mutation
    async def addToWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        watchlist_item = DbWatchlist(user_id=user.id, moviebox_id=str(movieId))
        db.add(watchlist_item)
        await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def logout(self) -> SuccessResponse:
        return SuccessResponse(success=True)

schema = strawberry.Schema(query=Query, mutation=Mutation)
