#!/usr/bin/env python3
"""
Script to add basic responsive improvements to the PMRV‑4em1 index.html file.

This script makes two small changes to `index.html` in place:

1. It ensures there is a `<meta name="viewport">` tag with
   `width=device-width` so that the page scales correctly on mobile
   devices.
2. It inserts a `<link rel="stylesheet" href="css/style.css">` after
   the `<meta name="viewport">` tag.  This allows you to move the bulk
   of your CSS into a separate file.  You will still need to create
   `css/style.css` yourself and copy your existing `<style>` contents
   into that file.

The script uses simple string replacements rather than a full HTML parser.
It looks for the first occurrence of `<head>` and inserts the new tags
immediately after it.  If the viewport meta tag already exists, it will
not be duplicated.

Usage:

    python3 patch_responsive_index.py /path/to/index.html

If no path is provided, it assumes `index.html` is in the current
directory.  The script prints a summary of what it changed.
"""

import sys
from pathlib import Path


def patch_index(index_path: Path) -> None:
    """Read the given HTML file, add responsive tags if missing, and write it back."""
    original = index_path.read_text(encoding="utf-8")

    modified = original
    inserted = False

    # Check for existing viewport meta tag
    if '<meta name="viewport"' not in original:
        # Prepare the tags to insert
        insertion = (
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
            "    <link rel=\"stylesheet\" href=\"css/style.css\">\n"
        )
        # Insert after the opening <head> tag
        if '<head>' in modified:
            modified = modified.replace('<head>', '<head>\n' + insertion, 1)
            inserted = True
        else:
            # Fall back: insert at the top of the document
            modified = insertion + modified
            inserted = True

    # Ensure we don't insert link twice if meta already exists
    elif '<link rel="stylesheet" href="css/style.css"' not in original:
        # Only insert the link tag after the existing viewport meta
        insertion = '    <link rel="stylesheet" href="css/style.css">\n'
        modified = modified.replace(
            '</head>', insertion + '</head>', 1
        )
        inserted = True

    if inserted:
        index_path.write_text(modified, encoding="utf-8")
        print(f"✅ Modified {index_path}: added responsive tags.")
    else:
        print(f"ℹ️  No changes needed; responsive tags already present.")


def main() -> int:
    # Determine which file to patch
    if len(sys.argv) > 1:
        index_file = Path(sys.argv[1])
    else:
        index_file = Path('index.html')

    if not index_file.exists():
        print(f"Error: {index_file} does not exist")
        return 1

    patch_index(index_file)
    return 0


if __name__ == '__main__':
    sys.exit(main())