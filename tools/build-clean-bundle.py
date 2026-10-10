#!/usr/bin/env python3
"""Stage only browser assets. No network, deployment, Git, or secret access."""

from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
ASSET_DIRS = ("source-images", "assets", "images", "fonts")
EXTENSIONS = {
    ".html", ".css", ".js", ".svg", ".jpg", ".jpeg", ".png", ".webp",
    ".avif", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".webm",
}
SPECIAL_FILES = {"_headers", "_redirects", "robots.txt", "sitemap.xml"}


def build(destination):
    if destination.is_symlink():
        raise ValueError("output folder must not be a symlink")
    out = destination.resolve()
    if out == ROOT or out in ROOT.parents:
        raise ValueError("output folder must not be the project or its parent")
    for name in ASSET_DIRS + ("functions", "lib", "tools", "tests", "partials", "worker", ".git", ".wrangler"):
        folder = ROOT / name
        if out == folder or folder in out.parents:
            raise ValueError("output folder must not be inside a source directory")
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        raise ValueError("output folder must be empty; inspect or choose another folder")

    candidates = list(ROOT.iterdir())
    for name in ASSET_DIRS:
        folder = ROOT / name
        if folder.is_symlink():
            raise ValueError(f"symlink not allowed: {name}")
        if folder.is_dir():
            candidates.extend(folder.rglob("*"))
    files = []
    for source in sorted(candidates):
        relative = source.relative_to(ROOT)
        if any(part.startswith(".") for part in relative.parts):
            continue
        if source.is_symlink():
            raise ValueError(f"symlink not allowed: {relative}")
        if source.is_file() and (source.suffix.lower() in EXTENSIONS or str(relative) in SPECIAL_FILES):
            files.append(source)
    if not any(source.name == "index.html" and source.parent == ROOT for source in files):
        raise ValueError("public index.html is missing")

    out.mkdir(parents=True, exist_ok=True)
    for source in files:
        target = out / source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    print(f"{len(files)} current public assets staged in {out}; nothing deployed")


if __name__ == "__main__":
    try:
        build(Path(sys.argv[1] if len(sys.argv) > 1 else "dist"))
    except (OSError, ValueError) as error:
        sys.exit(f"Bundle stopped: {error}")
