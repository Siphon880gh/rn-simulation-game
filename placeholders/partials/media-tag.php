<?php
/**
 * PHP partial — emit <img> or <video> placeholder tags with data-asset-prompt
 * for copy-paste into a chat agent.
 *
 * Usage:
 *   require_once __DIR__ . '/../lib/render.php';
 *   require_once __DIR__ . '/media-tag.php';
 *   echo ph_media_tag([
 *     'id' => 'dept-tele',
 *     'kind' => 'image', // image | video
 *     'title' => 'Telemetry unit',
 *     'prompt' => 'Create a still of a telemetry nursing station…',
 *     'w' => 480,
 *     'h' => 270,
 *     'class' => 'unit-tile__media',
 *     'base' => '/placeholders', // URL prefix to image.php / video.php
 *   ]);
 */

declare(strict_types=1);

if (!function_exists('ph_resolve_prompt')) {
    require_once dirname(__DIR__) . '/lib/render.php';
}

/**
 * @param array{
 *   id?: string,
 *   kind?: string,
 *   title?: string,
 *   prompt?: string,
 *   w?: int,
 *   h?: int,
 *   class?: string,
 *   base?: string,
 *   alt?: string,
 *   replaceWith?: string|null
 * } $opts
 */
function ph_media_tag(array $opts): string
{
    $id = (string) ($opts['id'] ?? '');
    $kind = strtolower((string) ($opts['kind'] ?? 'image'));
    if ($kind !== 'video') {
        $kind = 'image';
    }
    $title = (string) ($opts['title'] ?? 'Untitled');
    $w = (int) ($opts['w'] ?? 640);
    $h = (int) ($opts['h'] ?? 360);
    $prompt = ph_resolve_prompt($title, (string) ($opts['prompt'] ?? ''), $kind, $w, $h);
    $class = trim((string) ($opts['class'] ?? 'media-ph'));
    $base = rtrim((string) ($opts['base'] ?? '/placeholders'), '/');
    $alt = (string) ($opts['alt'] ?? $title);
    $replace = $opts['replaceWith'] ?? null;

    $endpoint = $kind === 'video' ? 'video.php' : 'image.php';
    $qs = http_build_query([
        'title' => $title,
        'prompt' => $prompt,
        'w' => $w,
        'h' => $h,
        'id' => $id,
    ]);
    $src = is_string($replace) && $replace !== ''
        ? $replace
        : $base . '/' . $endpoint . '?' . $qs;

    $attrs = [
        'class' => $class . ($kind === 'video' ? ' media-ph--video' : ' media-ph--image'),
        'data-asset-id' => $id,
        'data-asset-title' => $title,
        'data-asset-prompt' => $prompt,
        'data-media-kind' => $kind,
        'width' => (string) $w,
        'height' => (string) $h,
    ];

    if ($kind === 'video') {
        $attrStr = ph_attrs($attrs + [
            'poster' => $src,
            'muted' => true,
            'playsinline' => true,
            'preload' => 'none',
            'aria-label' => $alt,
        ]);
        // No <source> until replaceWith is a real video URL (then use video src).
        if (is_string($replace) && $replace !== '' && preg_match('/\.(mp4|webm|ogg)(\?|$)/i', $replace)) {
            return '<video ' . $attrStr . ' src="' . ph_escape($replace) . '"></video>';
        }
        return '<video ' . $attrStr . '></video>';
    }

    $attrStr = ph_attrs($attrs + [
        'src' => $src,
        'alt' => $alt,
        'loading' => 'lazy',
        'decoding' => 'async',
    ]);
    return '<img ' . $attrStr . '>';
}

/**
 * @param array<string, string|bool> $attrs
 */
function ph_attrs(array $attrs): string
{
    $out = [];
    foreach ($attrs as $k => $v) {
        if ($v === true) {
            $out[] = ph_escape((string) $k);
            continue;
        }
        if ($v === false || $v === null) {
            continue;
        }
        $out[] = ph_escape((string) $k) . '="' . ph_escape((string) $v) . '"';
    }
    return implode(' ', $out);
}
