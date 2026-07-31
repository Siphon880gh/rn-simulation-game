<?php
/**
 * Video placeholder — SVG poster with Title + play badge.
 * Use as <video poster="..."> until a real clip replaces it.
 *
 * Query: same as image.php (title, prompt, w, h, id, bg, fg, accent)
 *
 * Example:
 *   /placeholders/video.php?title=Code%20Blue&id=situation-code-blue
 */
declare(strict_types=1);

require __DIR__ . '/lib/render.php';

$title = ph_query_string('title', 'Untitled');
ph_emit_svg([
    'kind' => 'video',
    'title' => $title,
    'prompt' => ph_query_string('prompt', ''),
    'w' => ph_query_int('w', 640),
    'h' => ph_query_int('h', 360),
    'id' => ph_query_string('id', ''),
    'bg' => ph_query_string('bg', '#1a2332'),
    'fg' => ph_query_string('fg', '#e8eef2'),
    'accent' => ph_query_string('accent', '#3d8bfd'),
]);
