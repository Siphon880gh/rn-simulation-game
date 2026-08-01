<?php
/**
 * Placeholder media demo — lists tags with data-asset-prompt for copy-paste.
 * Run: php -S localhost:8765 -t .   then open /placeholders/
 */
declare(strict_types=1);

require __DIR__ . '/lib/render.php';
require __DIR__ . '/partials/media-tag.php';

$catalogPath = dirname(__DIR__) . '/game/assets/js/media-placeholder-catalog.json';
$catalog = [];
if (is_readable($catalogPath)) {
    $decoded = json_decode((string) file_get_contents($catalogPath), true);
    if (is_array($decoded) && isset($decoded['assets']) && is_array($decoded['assets'])) {
        $catalog = $decoded['assets'];
    }
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Placeholder media service</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; background: #e8eef2; color: #14212b; }
    h1 { font-size: 1.4rem; }
    .card { background: #fff; border: 1px solid #c5d0d8; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .card img, .card video { max-width: 100%; height: auto; display: block; border-radius: 6px; background: #1a2332; }
    code, pre { font-size: 0.8rem; background: #f0f4f7; padding: 0.15rem 0.35rem; border-radius: 4px; }
    pre { white-space: pre-wrap; padding: 0.75rem; overflow: auto; }
    .meta { font-size: 0.85rem; color: #3d5160; margin: 0.5rem 0; }
  </style>
</head>
<body>
  <h1>Placeholder image / video service</h1>
  <p class="meta">
    Endpoints: <code>image.php?title=…&amp;prompt=…</code> ·
    <code>video.php?title=…&amp;prompt=…</code> ·
    Partial: <code>partials/media-tag.php</code> → <code>ph_media_tag()</code>.
    Copy <code>data-asset-prompt</code> from any tag into a chat agent.
  </p>
<?php if (!$catalog): ?>
  <p>No catalog yet — showing sample tags.</p>
  <?php
    echo '<div class="card">';
    echo ph_media_tag([
        'id' => 'sample-image',
        'kind' => 'image',
        'title' => 'Sample image',
        'prompt' => 'Create a clinical still for RN simulation titled Sample image.',
        'w' => 480,
        'h' => 270,
        'base' => '/placeholders',
    ]);
    echo '</div><div class="card">';
    echo ph_media_tag([
        'id' => 'sample-video',
        'kind' => 'video',
        'title' => 'Sample video',
        'w' => 480,
        'h' => 270,
        'base' => '/placeholders',
    ]);
    echo '</div>';
else:
    foreach ($catalog as $asset):
        if (!is_array($asset)) {
            continue;
        }
        $id = (string) ($asset['id'] ?? '');
        echo '<div class="card" id="' . ph_escape($id) . '">';
        echo '<div class="meta"><strong>' . ph_escape($id) . '</strong> · '
            . ph_escape((string) ($asset['kind'] ?? 'image')) . ' · '
            . ph_escape((string) ($asset['mount'] ?? '')) . '</div>';
        $replace = $asset['replaceWith'] ?? null;
        // Catalog paths are relative to landing (`game/assets/...`) or in-game
        // (`assets/media/...` → game/assets/media). Rewrite for this demo URL.
        if (is_string($replace) && $replace !== '') {
            if (strpos($replace, 'assets/media/') === 0) {
                $replace = '../game/' . $replace;
            } elseif (strpos($replace, 'game/') === 0) {
                $replace = '../' . $replace;
            }
        }
        echo ph_media_tag([
            'id' => $id,
            'kind' => (string) ($asset['kind'] ?? 'image'),
            'title' => (string) ($asset['title'] ?? $id),
            'prompt' => (string) ($asset['prompt'] ?? ''),
            'w' => (int) ($asset['w'] ?? 480),
            'h' => (int) ($asset['h'] ?? 270),
            'replaceWith' => $replace,
            'base' => '.',
            'class' => 'media-ph',
        ]);
        echo '<p class="meta">Prompt (also on <code>data-asset-prompt</code>):</p>';
        echo '<pre>' . ph_escape(ph_resolve_prompt(
            (string) ($asset['title'] ?? $id),
            (string) ($asset['prompt'] ?? ''),
            (string) ($asset['kind'] ?? 'image'),
            (int) ($asset['w'] ?? 640),
            (int) ($asset['h'] ?? 360)
        )) . '</pre>';
        echo '</div>';
    endforeach;
endif; ?>
</body>
</html>
