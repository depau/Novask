from __future__ import print_function, unicode_literals

import datetime, time
from novask.database import db


class SearchJob(db.Model):
    __tablename__ = 'search_jobs'
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False)
    worker_pid = db.Column(db.Integer, unique=True, nullable=True)
    done = db.Column(db.Boolean, default=False)
    time_started = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    time_finished = db.Column(db.DateTime, nullable=True, default=None)
    progress = db.Column(db.Integer, default=0)
    query = db.Column(db.String(1000))
    engines = db.Column(db.String(500))
    category = db.Column(db.String(100))
    results = db.relationship("Result", back_populates='job')

    def __init__(self, uuid, worker_pid=None, done=False):
        self.uuid = uuid
        self.worker_pid = worker_pid
        self.done = done

    def __repr__(self):
        return '<SearchJob {uuid}, PID={pid}, {done}>'\
                .format(uuid=self.uuid, pid=self.worker_pid,
                        done="running" if not self.done else "finished")

class Result(db.Model):
    __tablename__ = 'results'
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(36), db.ForeignKey('search_jobs.uuid'))
    job = db.relationship("SearchJob", back_populates='results')
    found_at = db.Column(db.BigInteger, default=lambda: int(time.time()*100))

    # link|name|size|seeds|leech|engine_url
    link  = db.Column(db.String(3000))
    name  = db.Column(db.String(1000))
    size  = db.Column(db.BigInteger)
    seeds = db.Column(db.Integer)
    leech = db.Column(db.Integer)
    engine_url = db.Column(db.String(300))
    desc_link  = db.Column(db.String(3000))

    def __init__(self, job=None, link=None, name=None, size=None, seeds=None, leech=None, engine_url=None, desc_link=None, found_at=None):
        self.job = job
        self.link = link
        self.name = name
        self.size = size
        self.seeds = seeds
        self.leech = leech
        self.engine_url = engine_url
        if desc_link:
            self.desc_link = desc_link
        if found_at:
            self.found_at = found_at

    def __repr__(self):
        return '<Result {name}, job {job_id}, from {url}>'\
                .format(name=self.name, job_id=self.job_id, url=self.engine_url)