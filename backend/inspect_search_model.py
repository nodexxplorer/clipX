import inspect
from moviebox_api import models

def find_class(module, class_name):
    for name, obj in inspect.getmembers(module):
        if inspect.ismodule(obj):
            res = find_class(obj, class_name)
            if res: return res
        if inspect.isclass(obj) and name == class_name:
            return obj
    return None

import moviebox_api.models.search
print(f"SEARCH MODELS: {dir(moviebox_api.models.search)}")
cls = getattr(moviebox_api.models.search, 'SearchResultsItem', None)
if cls:
    print(f"FOUND: {cls}")
    print(f"INIT: {inspect.signature(cls.__init__)}")
else:
    print("NOT FOUND")
