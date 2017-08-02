from __future__ import print_function, unicode_literals

import datetime
import signal
import sys
import uuid
import subprocess

import os
from flask import render_template, jsonify, request, redirect, Response

from novask import app, nova
from novask.database import db
from novask.models import SearchJob, Result
from novask.utils import get_engines_dirs, results_to_serializable
from werkzeug.exceptions import BadRequest

@app.route('/')
def index():
    d = get_engines_dirs()
    engines = nova.get_engines(d)

    return render_template('index.html', engines=engines, category="all", sorted=sorted)


@app.route('/search/')
def search():
    query = request.args.get("q")
    uuid = request.args.get("uuid")
    en_engines = request.args.get("engines")
    category = request.args.get("category")

    if uuid:
        j = db.session.query(SearchJob).filter(SearchJob.uuid == uuid).first()
        if not query:
            query = j.query
        if not en_engines:
            en_engines = j.engines
        if not category:
            category = j.category

    if not en_engines:
        en_engines = "all"
    if not category:
        category = "all"

    d = get_engines_dirs()
    engines = nova.get_engines(d)

    dis_engines = []
    if en_engines != "all":
        s = set(engines.keys())
        e = set(en_engines.split(","))
        dis_engines = list(s-e)

    return render_template('search.html', engines=engines,
                           query=query, dis_engines=dis_engines,
                           uuid=uuid, category=category, sorted=sorted)

@app.route('/api/v1.0/search', methods=["POST"])
def api_1_0_search():
    uu = str(uuid.uuid1())
    q = request.form.get("query")
    c = request.form.get("category", "all")
    e = request.form.get("engines", "all")

    if q is None:
        raise BadRequest("query is required")

    # if daemonize() > 0:
    #     Parent process
    #     return jsonify({"uuid": uu})

    # Child process
    # sys.stdout.flush()
    # sys.stderr.flush()
    sys.stdout = open("/tmp/puttana.zoccola", "a")
    sys.stderr = sys.stdout
    p = subprocess.Popen(["daemon", "novask_searchworker", uu, e, c, q], stdout=open("/tmp/worker1.log", "a"), stderr=subprocess.STDOUT)
    p.wait()
    try:
        p.stdout.close()
        sys.stdout.flush()
        sys.stdout.close()
    except:
        pass
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__
    # sys.exit()
    return jsonify({"uuid": uu})

@app.route('/api/v1.0/results', methods=["GET"])
def api_1_0_results():
    uuid = request.args.get("uuid")
    since = request.args.get("since", 0)

    if uuid is None:
        raise BadRequest("uuid is required")

    job = db.session.query(SearchJob).filter(SearchJob.uuid == uuid).first()
    r = db.session.query(Result).filter(Result.job_id == uuid, Result.found_at > since).all()
    j = results_to_serializable(r)

    if not job:
        job_done = False
        job_progress = 0
    else:
        job_progress = job.progress
        if (datetime.datetime.utcnow() - job.time_started).total_seconds() > app.config["NOVASK_SEARCH_TIMEOUT"]:
            job_done = True
        else:
            job_done = job.done

    mainj = {
        "finished": job_done,
        "results": j,
        "progress": job_progress
    }

    return jsonify(mainj)


@app.route('/api/v1.0/stopsearch', methods=["GET"])
def api_1_0_stopsearch():
    uuid = request.args.get("uuid")
    job = db.session.query(SearchJob).filter(SearchJob.uuid == uuid).first()

    if job:
        os.kill(job.worker_pid, signal.SIGTERM)

    return jsonify({"status": "success"})

@app.route('/api/v1.0/download/<filename>', methods=["GET"])
def api_1_0_download(filename=None):
    # filename is ignored, it's just for the browser
    url = request.args.get("url")
    engine = request.args.get("engine")

    if url.startswith("magnet"):
        return redirect(url, code=302)

    if not url.startswith("http") or not engine.startswith("http"):
        raise BadRequest("url and engine must be HTTP URLs")

    d = get_engines_dirs()
    t = nova.download_torrent(url, engine, engines_dirs=d)

    return Response(t, mimetype="application/x-bittorrent")