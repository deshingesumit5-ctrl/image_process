<?php

namespace Database\Seeders;

use App\Models\Background;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

class BackgroundSeeder extends Seeder
{
    public function run(): void
    {
        $dir = storage_path('app/public/backgrounds');
        File::ensureDirectoryExists($dir);
        $script = dirname(base_path()).DIRECTORY_SEPARATOR.'processing_service'.DIRECTORY_SEPARATOR.'seed_backgrounds.py';
        if (is_file($script)) {
            $process = new Process(['python', $script, $dir]);
            $process->setTimeout(60);
            $process->run();
        }

        $rows = [
            ['White Studio', 'White', 'backgrounds/white-vertical.png', 'vertical', 1200, 1600],
            ['Soft Studio', 'Studio', 'backgrounds/studio-vertical.png', 'vertical', 1200, 1600],
            ['Warm Wood', 'Wood', 'backgrounds/wood-vertical.png', 'vertical', 1200, 1600],
            ['Indigo Gradient', 'Gradient', 'backgrounds/gradient-vertical.png', 'vertical', 1200, 1600],
            ['Light Wall', 'Wall', 'backgrounds/wall-vertical.png', 'vertical', 1200, 1600],
            ['White Horizontal', 'White', 'backgrounds/white-horizontal.png', 'horizontal', 1600, 1200],
            ['Studio Horizontal', 'Studio', 'backgrounds/studio-horizontal.png', 'horizontal', 1600, 1200],
        ];

        foreach ($rows as [$name, $type, $path, $orientation, $w, $h]) {
            if (! is_file(storage_path('app/public/'.$path))) {
                continue;
            }
            Background::query()->updateOrCreate(
                ['name' => $name, 'orientation' => $orientation],
                [
                    'category_type' => $type,
                    'image_path' => $path,
                    'width' => $w,
                    'height' => $h,
                    'status' => true,
                ]
            );
        }
    }
}
