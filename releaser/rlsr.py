import json
import os
import re
import zipfile

from configparser import ConfigParser
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, List, Iterator


SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent

FIND_RULES = (
    ('html', ('.html', '.js', '.css')),
    ('js', ('.js', )),
    ('img', ('.png', '.svg')),
    ('background.js'),
    ('manifest.json'),
)


class AbstractReleaser:
    NAME: str
    PACKAGE_NAME: str = '4pda-inspector'

    def __init__(self):
        self._manifest: Dict = self.__read_manifest()
        self._version, self._config = self.__read_config()
        self._prepare_data()

    def __read_manifest(self) -> Dict:
        with open(ROOT_DIR / "manifest.json", "r", encoding='utf-8') as f:
            manifest = json.load(f)
            assert all(key in manifest for key in ('name', 'version', 'description')), 'Invalid Manifest'
            return manifest

    def __read_config(self) -> Tuple[List, Dict]:
        config = ConfigParser()
        config.read(SCRIPT_DIR / "data.ini", encoding='utf-8')
        config_data = dict(config['MAIN'])
        assert all(key in config_data for key in ('name', 'version', 'description')), 'Invalid Config'

        try:
            assert re.match(r'^\b\d+(?:\.\d+)+$', config_data['version'])
            version = config_data['version'].split('.')
            assert len(version) <= 4
        except AssertionError:
            raise AssertionError(f"Invalid version: `{config_data['version']}`")

        return version, config_data

    def save_manifest(self):
        self._manifest.update(self._config)
        with open(ROOT_DIR / "manifest.json", "w", encoding='utf-8') as f:
            json.dump(self._manifest, f, indent=4, ensure_ascii=False)

    def _prepare_data(self): ...

    def _files_finder(self) -> Iterator[Tuple[str, str]]:
        for rule in FIND_RULES:
            if isinstance(rule, tuple):
                d, e = rule
                for root, _, files in os.walk(d):
                    for file in files:
                        if any(file.endswith(ext) for ext in e):
                            yield root, file
            elif isinstance(rule, str):
                yield '', rule
    @property
    def zip_filename(self):
        return f'{self.PACKAGE_NAME}.zip'

    def zip_files(self):
        with zipfile.ZipFile(f'release/{self.zip_filename}', 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, file in self._files_finder():
                zipf.write(os.path.join(root, file))

        print(f'Created {self.zip_filename}')


class ProdReleaser(AbstractReleaser):
    NAME = "prod"

    def _prepare_data(self):
        if 'version_name' in self._manifest:
            del self._manifest['version_name']

    def _files_finder(self) -> Iterator[Tuple[str, str]]:
        for root, file in super()._files_finder():
            if file.startswith("test"):
                continue
            yield root, file

    @property
    def zip_filename(self):
        return f'{self.PACKAGE_NAME}-{self._config["version"]}.zip'


class BetaReleaser(AbstractReleaser):
    NAME = "beta"

    def _prepare_data(self):
        self._config['name'] += " BETA"
        self._config['description'] += " THIS EXTENSION IS FOR BETA TESTING."
        while len(self._version) < 4:
            self._version.append('0')
        self._version[3] = datetime.now().strftime("%m%d")
        self._config['version'] = '.'.join(self._version)
        self._config['version_name'] = f"{self._version[0]}.DEV.{self._version[3]}"

    @property
    def zip_filename(self):
        return f'{self.PACKAGE_NAME}-BETA-{self._config["version_name"]}.zip'


__all__ = ('ProdReleaser', 'BetaReleaser')
