"""Streamlit entry point for the Arena Shooter.

Streamlit only serves Python apps, and the game itself is a static
HTML/CSS/ES-module site with no server of its own. Rather than hand-copy
the game's logic into this file (which would drift out of sync with the
real source), this script reads index.html, style.css and js/*.js at
runtime, inlines them into one self-contained page, and renders that page
in an embedded Streamlit component. js/*.js stays the single source of
truth for the game itself.

Run locally with:
    streamlit run streamlit_app.py
"""

import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

BASE_DIR = Path(__file__).parent
JS_DIR = BASE_DIR / "js"

# Local modules must be concatenated after the modules they import from.
MODULE_ORDER = [
    "config.js",
    "collision.js",
    "input.js",
    "hud.js",
    "gameState.js",
    "arena.js",
    "player.js",
    "enemy.js",
    "combat.js",
    "main.js",
]

_LOCAL_IMPORT_RE = re.compile(r'^[ \t]*import\s+.*?from\s+["\']\./[^"\']+["\'];?[ \t]*\n?', re.MULTILINE)
_THREE_IMPORT_RE = re.compile(r'^[ \t]*import\s+\*\s+as\s+THREE\s+from\s+["\']three["\'];?[ \t]*\n?', re.MULTILINE)
_ADDON_IMPORT_RE = re.compile(r'^[ \t]*import\s+\{[^}]*\}\s+from\s+["\']three/addons/[^"\']+["\'];?[ \t]*\n?', re.MULTILINE)
_EXPORT_KEYWORD_RE = re.compile(r"^export(?=\s+(?:class|const|function|let)\s)", re.MULTILINE)
_EXPORT_NAME_RE = re.compile(r"^export\s+(?:class|const|function|let)\s+(\w+)", re.MULTILINE)


def _wrap_module(name, source):
    """Turn one file's module body into a scoped chunk of the bundle.

    Each source file is its own ES module with its own private scope, so
    module-local helper names (e.g. both player.js and combat.js declare a
    private `const UP = ...`) never collide. Flattening everything into one
    script would otherwise cause duplicate top-level declarations, so each
    file's body runs inside its own IIFE, and only the names it originally
    `export`ed are pulled into the shared outer scope for later modules
    (which are ordered, via MODULE_ORDER, to always come after what they
    depend on).
    """
    exported_names = _EXPORT_NAME_RE.findall(source)
    body = _EXPORT_KEYWORD_RE.sub("", source).strip()

    if not exported_names:
        # No exports (main.js): its top-level statements just run directly;
        # nothing later in the bundle needs to see its internals.
        return f"// ---- {name} ----\n{body}"

    names = ", ".join(exported_names)
    wrapped = f"const {{ {names} }} = (function () {{\n{body}\nreturn {{ {names} }};\n}})();"
    return f"// ---- {name} ----\n{wrapped}"


def _bundle_game_script():
    """Merge the game's ES modules into a single inline <script type="module">.

    The embedding iframe has no file system to resolve relative "./foo.js"
    paths against, so the local modules are merged in dependency order
    instead. The "three" and "three/addons/" imports are left as real
    imports since they resolve by absolute CDN URL via the page's import
    map regardless of where the page itself is hosted.
    """
    addon_imports = []
    bodies = []

    for name in MODULE_ORDER:
        source = (JS_DIR / name).read_text(encoding="utf-8")
        addon_imports.extend(match.strip() for match in _ADDON_IMPORT_RE.findall(source))
        source = _ADDON_IMPORT_RE.sub("", source)
        source = _THREE_IMPORT_RE.sub("", source)
        source = _LOCAL_IMPORT_RE.sub("", source)
        bodies.append(_wrap_module(name, source))

    header = ['import * as THREE from "three";', *dict.fromkeys(addon_imports)]
    return "\n".join(header) + "\n\n" + "\n\n".join(bodies)


def _build_page_html():
    """Inline style.css and the bundled game script into index.html."""
    html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
    css = (BASE_DIR / "style.css").read_text(encoding="utf-8")
    bundled_js = _bundle_game_script()

    html = html.replace(
        '<link rel="stylesheet" href="style.css" />',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script type="module" src="js/main.js"></script>',
        f'<script type="module">\n{bundled_js}\n</script>',
    )
    return html


def main():
    st.set_page_config(page_title="Arena Shooter", page_icon="🎮", layout="wide")
    st.title("Arena Shooter")
    st.caption(
        "A keyboard-only 3D first-person shooter against one AI opponent, built with Three.js."
    )
    st.markdown(
        "**Controls:** `↑`/`↓` move · `←`/`→` turn · `Space` shoot — "
        "click inside the game window below first so it can receive key presses."
    )

    components.html(_build_page_html(), height=820, scrolling=False)


if __name__ == "__main__":
    main()
