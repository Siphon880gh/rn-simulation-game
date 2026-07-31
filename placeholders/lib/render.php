<?php
/**
 * Shared SVG placeholder renderer (image + video poster).
 * Query: title, prompt (optional), w, h, bg, fg, accent, id
 */

declare(strict_types=1);

function ph_query_string(string $key, string $default = ''): string
{
    if (!isset($_GET[$key])) {
        return $default;
    }
    return trim((string) $_GET[$key]);
}

function ph_query_int(string $key, int $default, int $min = 16, int $max = 4096): int
{
    if (!isset($_GET[$key]) || $_GET[$key] === '') {
        return $default;
    }
    $n = (int) $_GET[$key];
    if ($n < $min) {
        return $min;
    }
    if ($n > $max) {
        return $max;
    }
    return $n;
}

function ph_escape(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

/**
 * Shared style line — keep aligned with GameConfig.mediaPlaceholders.promptStyleAppendix.
 */
function ph_prompt_style_appendix(): string
{
    return 'Style (fun medical simulation): approachable educational game art for an RN shift sim — '
        . 'clear readable shapes, lightly playful personality without cartoon stickers, horror, or gore; '
        . 'bright but clinical hospital palette; panels-first UI friendly; fictional patients/signage only '
        . '(no real faces, no PHI); readable at small sizes; include any requested title as subtle in-frame caption.';
}

function ph_with_prompt_style(string $basePrompt): string
{
    $base = trim($basePrompt);
    $style = ph_prompt_style_appendix();
    if ($style === '') {
        return $base;
    }
    if ($base === '') {
        return $style;
    }
    if (str_contains($base, 'Style (fun medical simulation)')) {
        return $base;
    }
    return $base . ' ' . $style;
}

function ph_with_prompt_dimensions(string $basePrompt, int $w, int $h, string $kind = 'image'): string
{
    $w = max(1, $w);
    $h = max(1, $h);
    $dimLine = $kind === 'video'
        ? "Dimensions: {$w}×{$h}px — produce the video framed for this size (export usable at {$w}×{$h}; short silent loop)."
        : "Dimensions: {$w}×{$h}px — produce the still at these pixel dimensions (2× retina optional).";
    $base = trim($basePrompt);
    if ($base === '') {
        return $dimLine;
    }
    if (preg_match('/\bDimensions:\s*\d+[×x]\d+px\b/u', $base)) {
        return $base;
    }
    return $base . ' ' . $dimLine;
}

/**
 * Build a copy-paste agent prompt from title + optional prompt query.
 * Order: subject → dimensions → shared fun-medical-simulation style.
 */
function ph_resolve_prompt(
    string $title,
    string $prompt,
    string $kind,
    int $w = 640,
    int $h = 360
): string {
    $prompt = trim($prompt);
    if ($prompt !== '') {
        $body = $prompt;
    } else {
        $kindLabel = $kind === 'video' ? 'short looping video clip' : 'still image';
        $body = "Create a {$kindLabel} for an RN hospital shift simulation UI. "
            . "Subject title: {$title}. "
            . "Include the title text \"{$title}\" as a subtle caption or signage in-frame.";
    }
    return ph_with_prompt_style(ph_with_prompt_dimensions($body, $w, $h, $kind));
}

/**
 * Render placeholder SVG (image or video badge).
 */
function ph_render_svg(array $opts): string
{
    $title = (string) ($opts['title'] ?? 'Untitled');
    $kind = (string) ($opts['kind'] ?? 'image');
    $w = (int) ($opts['w'] ?? 640);
    $h = (int) ($opts['h'] ?? 360);
    $bg = (string) ($opts['bg'] ?? ($kind === 'video' ? '#1a2332' : '#2c3e50'));
    $fg = (string) ($opts['fg'] ?? '#e8eef2');
    $accent = (string) ($opts['accent'] ?? ($kind === 'video' ? '#3d8bfd' : '#0d6e6e'));
    $id = (string) ($opts['id'] ?? '');

    $safeTitle = ph_escape($title);
    $badge = $kind === 'video' ? 'VIDEO PLACEHOLDER' : 'IMAGE PLACEHOLDER';
    $display = $title;
    if (function_exists('mb_strlen') && mb_strlen($display) > 42) {
        $display = mb_substr($display, 0, 39) . '…';
    } elseif (strlen($display) > 42) {
        $display = substr($display, 0, 39) . '…';
    }
    $safeDisplay = ph_escape($display);
    $innerW = max(0, $w - 24);
    $innerH = max(0, $h - 24);
    $titleY = $kind === 'video' ? (int) round($h * 0.72) : (int) round($h * 0.52);

    $parts = [];
    $parts[] = '<svg xmlns="http://www.w3.org/2000/svg" width="' . $w . '" height="' . $h . '" viewBox="0 0 ' . $w . ' ' . $h . '" role="img" aria-label="' . $safeTitle . '">';
    $parts[] = '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">';
    $parts[] = '<stop offset="0%" stop-color="' . ph_escape($bg) . '"/>';
    $parts[] = '<stop offset="100%" stop-color="' . ph_escape($accent) . '" stop-opacity="0.55"/>';
    $parts[] = '</linearGradient></defs>';
    $parts[] = '<rect width="100%" height="100%" fill="url(#g)"/>';
    $parts[] = '<rect x="12" y="12" width="' . $innerW . '" height="' . $innerH . '" rx="8" fill="none" stroke="' . ph_escape($fg) . '" stroke-opacity="0.25" stroke-width="2"/>';
    $parts[] = '<text x="24" y="40" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" font-weight="700" letter-spacing="0.08em" fill="' . ph_escape($accent) . '">' . ph_escape($badge) . '</text>';

    if ($kind === 'video') {
        $cx = (int) round($w * 0.5);
        $cy = (int) round($h * 0.42);
        $tx = $cx - 10;
        $ty1 = $cy - 16;
        $ty2 = $cy + 16;
        $tx2 = $cx + 18;
        $parts[] = '<circle cx="' . $cx . '" cy="' . $cy . '" r="36" fill="' . ph_escape($accent) . '" fill-opacity="0.85"/>';
        $parts[] = '<polygon points="' . $tx . ',' . $ty1 . ' ' . $tx . ',' . $ty2 . ' ' . $tx2 . ',' . $cy . '" fill="' . ph_escape($fg) . '"/>';
    }

    $parts[] = '<text x="50%" y="' . $titleY . '" text-anchor="middle" font-family="Georgia,ui-serif,serif" font-size="28" font-weight="700" fill="' . ph_escape($fg) . '">' . $safeDisplay . '</text>';
    if ($id !== '') {
        $parts[] = '<text x="50%" y="' . ($h - 28) . '" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" fill="' . ph_escape($fg) . '" fill-opacity="0.55">' . ph_escape($id) . '</text>';
    }
    $parts[] = '</svg>';
    return implode('', $parts);
}

function ph_emit_svg(array $opts): void
{
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    $prompt = ph_resolve_prompt(
        (string) ($opts['title'] ?? ''),
        (string) ($opts['prompt'] ?? ''),
        (string) ($opts['kind'] ?? 'image'),
        (int) ($opts['w'] ?? 640),
        (int) ($opts['h'] ?? 360)
    );
    header('X-Asset-Prompt: ' . str_replace(["\r", "\n"], ' ', $prompt));
    echo ph_render_svg($opts);
}
