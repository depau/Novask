from distutils.core import setup

setup(
    name='novask',
    version='0.1',
    packages=['novask'],
    url='https://github.com/Depaulicious/Novask',
    license='GPLv3',
    author='Davide Depau',
    author_email='davide@depau.eu',
    description='A torrent search web app based on qBittorrent\'s search engine',
    include_package_data=True,
    install_requires=[
        'Flask',
        'SQLAlchemy',
        'Flask-SQLAlchemy',
        'nova6'
    ],
    entry_points = {
        "console_scripts": [
            "novask_searchworker = novask.searchworker:main"
        ]
    }
)
