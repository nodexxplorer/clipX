from moviebox_api.models.search import SearchResultsItem
from moviebox_api.constants import SubjectType
import inspect

item = SearchResultsItem(subjectId='123', subjectType=SubjectType.MOVIES)
print(f"Item attributes: {dir(item)}")
print(f"ID: {item.subjectId}")
print(f"Type: {item.subjectType}")

from moviebox_api.core import MovieDetails
print(f"MovieDetails source: {inspect.getsource(MovieDetails.__init__)}")
