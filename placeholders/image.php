<?php
/**
 * Image placeholder — SVG with Title drawn on the image.
 *
 * Query:
 *   title   (required) — text shown on the placeholder
 *   prompt  (optional) — copy-paste agent brief (also in X-Asset-Prompt header)
 *   w, h    (optional) — pixel size (default 640×360)
 *   id      (optional) — asset id footer
 *   bg, fg, accent (optional) — colors
 *
 * Example:
 *   /placeholders/image.php?title=Code%20Blue&id=situation-code-blue&prompt=...
 */
declare(strict_types=1);

require __DIR__ . '/lib/render.php';

$title = ph_query_string('title', 'Untitled');
ph_emit_svg([
    'kind' => 'image',
    'title' => $title,
    'prompt' => ph_query_string('prompt', ''),
    'w' => ph_query_int('w', 640),
    'h' => ph_query_int('h', 360),
    'id' => ph_query_string('id', ''),
    'bg' => ph_query_string('bg', '#2c3e50'),
    'fg' => ph_query_string('fg', '#e8eef2'),
    'accent' => ph_query_string('accent', '#0d6e6e'),
]);
