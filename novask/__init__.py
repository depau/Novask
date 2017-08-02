import os
from flask import Flask
from novask.settings import DefaultSettings

app = Flask(__name__, static_url_path='/static',
            instance_relative_config=True,
            instance_path=os.environ.get("NOVASK_INSTANCE_PATH", None))
app.config.from_object(DefaultSettings)
app.config.from_pyfile('novask.cfg', silent=True)

import novask.views

if __name__ == '__main__':
    app.run()
