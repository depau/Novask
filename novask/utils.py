from __future__ import print_function, unicode_literals

import os
import sys
from . import app

def get_engines_dirs():
    d = os.path.join(app.instance_path, app.config.get("ENGINES_DIR", "engines/"))
    if os.path.exists(d) and os.path.isdir(d):
        return [d]
    return []

def daemonize():
    pid = os.fork()
    if pid > 0:
        return pid

    # Move std{in,out,err} to /dev/null
    devnull_fd = os.open(os.devnull, os.O_RDWR)
    for i in range(3):
        os.dup2(devnull_fd, i)
    os.close(devnull_fd)

    os.umask(0o27)
    os.setsid()
    os.chdir("/")

    if os.fork() > 0:
        sys.exit()

    # Move std{in,out,err} to /dev/null
    devnull_fd = os.open(os.devnull, os.O_RDWR)
    for i in range(3):
        os.dup2(devnull_fd, i)
    os.close(devnull_fd)

def results_to_serializable(reslist):
    j = []
    for r in reslist:
        rj = {
            "link": r.link,
            "name": r.name,
            "size": r.size,
            "seeds": r.seeds,
            "leech": r.leech,
            "engine_url": r.engine_url,
            "desc_link": r.desc_link,
            "found_at": r.found_at
        }
        j.append(rj)
    return j

