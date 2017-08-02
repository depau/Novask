from __future__ import print_function, unicode_literals

import os
import sys
import datetime

from novask import nova
from novask.database import db

from novask.models import SearchJob, Result
from novask.utils import get_engines_dirs

def run_search(uuid, engines, category, *query):
    query = " ".join(query)
    # Create search job in database
    j = SearchJob(uuid, os.getpid())
    j.query = query
    j.category = category
    j.engines = engines
    db.session.add(j)
    db.session.commit()

    try:
        dirs = get_engines_dirs()
        count = 0
        for result in nova.search(query=query, engines=engines, category=category, engines_dirs=dirs, progress=True):
            if "progress" in result:
                j.progress = result["progress"]
            else:
                r = Result(j, result["link"], result["name"], result["size"], result["seeds"],
                   result["leech"], result["engine_url"], result["desc_link"], count)
                db.session.add(r)
            # Commit every time so results are available immediately
            db.session.commit()
            count += 1
    finally:
        j.done = True
        j.time_finished = datetime.datetime.utcnow()
        db.session.commit()

def main():
    import sys
    sys.stdout = open("/tmp/worker.log", "a")
    sys.stderr = sys.stdout
    args = sys.argv[1:]
    print (sys.argv)
    run_search(*args)

if __name__ == "__main__":
    main()