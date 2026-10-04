"""Verify exact imported release files without rewriting the runtime."""
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
inventory = json.loads((root / 'docs/baseline-1.9.24/SYNC_INVENTORY.json').read_text())
for entry in inventory['runtime_files']:
    path = root / entry['path']
    assert path.is_file(), f'Missing: {path}'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256'], f'Changed: {path}'
for entry in inventory['removed_obsolete_runtime_files']:
    assert not (root / entry['path']).exists(), f'Obsolete runtime remains: {entry["path"]}'
manifest = json.loads((root / 'manifest.json').read_text())
assert manifest['version'] == manifest['version_name'] == '1.9.24'
refs = [manifest['background']['service_worker'], manifest['action']['default_popup']]
refs += list(manifest['icons'].values()) + list(manifest['action']['default_icon'].values())
for entry in manifest['content_scripts']:
    refs += entry.get('js', []) + entry.get('css', [])
for entry in manifest.get('web_accessible_resources', []):
    refs += entry['resources']
assert all((root / path).is_file() for path in refs), 'Unresolved manifest reference'
scripts = [entry['path'] for entry in inventory['runtime_files'] if entry['path'].endswith('.js')]
for path in scripts:
    subprocess.run(['node', '--check', str(root / path)], check=True, capture_output=True)
for name in ['test_fix20_perf_probe.js', 'test_sis_liveness_performance.js', 'test_sis_vietnamese_name_display.js']:
    subprocess.run(['node', str(root / 'handoff/tests' / name), str(root)], check=True)
print(f'PASS: {len(inventory["runtime_files"])} exact files, {len(scripts)} scripts, manifest, stale-file absence, 3 Node suites')
