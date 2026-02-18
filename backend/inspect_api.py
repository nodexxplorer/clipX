import inspect
from moviebox_api import core

print("CORE classes:")
for name, obj in inspect.getmembers(core):
    if inspect.isclass(obj):
        print(f"- {name}")

from moviebox_api.core import MovieDetails
print("\nMovieDetails init signature:")
print(inspect.signature(MovieDetails.__init__))
