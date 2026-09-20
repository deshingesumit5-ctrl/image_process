<?php

return [
    /*
    | Standard output sizes per orientation.
    | Confirm with the client before changing these pixel targets.
    */
    'horizontal' => [
        'width' => (int) env('IMAGE_H_WIDTH', 1600),
        'height' => (int) env('IMAGE_H_HEIGHT', 1200),
    ],
    'vertical' => [
        'width' => (int) env('IMAGE_V_WIDTH', 1200),
        'height' => (int) env('IMAGE_V_HEIGHT', 1600),
    ],
    'max_upload_kb' => (int) env('IMAGE_MAX_UPLOAD_KB', 8192),
    'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
    'rembg_url' => env('REMBG_URL', 'http://127.0.0.1:8001/remove'),
    'process_url' => env('PROCESS_URL', 'http://127.0.0.1:8001'),
];
