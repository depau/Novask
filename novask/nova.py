from __future__ import print_function, unicode_literals

import subprocess
import xml.etree.ElementTree as ET

import os


def get_dir_args(e_dirs):
    dirs = []
    for d in e_dirs:
        dirs.append("-d")
        dirs.append(d)
    return dirs

def get_engines(engines_dirs=[]):
    engines = {}

    o = subprocess.check_output(["nova6"] + get_dir_args(engines_dirs) + ["--capabilities"]).decode()
    xml = ET.fromstring(o)

    # Iterate over engines
    for e in xml:
        engines[e.tag] = {}
        # Iterate over engine info
        for t in e:
            engines[e.tag][t.tag] = t.text

    return engines

def search_result_dict(line):
    if line.startswith("progress="):
        p = int(line.split("=")[1])
        return {"progress": p}

    r = line.split("|")
    return {
        "link": r[0].strip(),
        "name": r[1].strip(),
        "size": int(r[2]),
        "seeds": int(r[3]),
        "leech": int(r[4]),
        "engine_url": r[5].strip(),
        "desc_link": r[6].strip() if len(r) >= 6 else None
    }


def search(query, engines="all", category="all", engines_dirs=[], progress=False):
    p = ["-p"] if progress else []
    print(["nova6"] + p + get_dir_args(engines_dirs) + [engines, category] + query.split())
    p = subprocess.Popen(["nova6"] + p + get_dir_args(engines_dirs) + [engines, category] + query.split(), stdout=subprocess.PIPE)

    for res in p.stdout.readlines():
        try:
            yield search_result_dict(res.decode())
        except IndexError:
            continue

    p.wait()

def download_torrent(url, engine_url, engines_dirs=[]):
    o = subprocess.check_output(["nova6dl"] + get_dir_args(engines_dirs) + [engine_url, url])
    l = o.split(b" ", 1)

    with open(l[0], "rb") as f:
        torrent = f.read()
    os.remove(l[0])

    return torrent
