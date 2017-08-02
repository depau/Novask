from __future__ import print_function, unicode_literals

class DefaultSettings(object):
    DEBUG = False
    ENGINES_DIR = "engines/"
    SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/test.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    NOVASK_SEARCH_TIMEOUT = 120
