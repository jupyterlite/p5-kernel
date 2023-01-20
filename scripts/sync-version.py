from pathlib import Path
import json

root = Path(__file__).parent.parent
version_file = root / "packages" / "p5-kernel-extension" / "package.json"
package_file = root / "package.json"

version_json = json.loads(version_file.read_text())
version = version_json["version"]

package_json = json.loads(package_file.read_text())
package_json["version"] = version

package_file.write_text(json.dumps(package_json, indent=2))
