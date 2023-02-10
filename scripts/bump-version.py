import argparse
import json

from pathlib import Path
from subprocess import run

parser = argparse.ArgumentParser()
parser.add_argument("version")
args = parser.parse_args()
version = args.version

run(f'jlpm run bump:js:version {version}', shell=True, check=True)

root = Path(__file__).parent.parent
version_file = root / "packages" / "p5-kernel-extension" / "package.json"
package_file = root / "package.json"

version_json = json.loads(version_file.read_text())
version = version_json["version"]

package_json = json.loads(package_file.read_text())
package_json["version"] = version

package_file.write_text(json.dumps(package_json, indent=2))
