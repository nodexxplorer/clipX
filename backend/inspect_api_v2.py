import inspect
from moviebox_api import core

for name, obj in inspect.getmembers(core):
    if inspect.isclass(obj):
        print(f"CLASS: {name}")
        # print(dir(obj))
        try:
            print(f"  INIT: {inspect.signature(obj.__init__)}")
        except:
            pass
