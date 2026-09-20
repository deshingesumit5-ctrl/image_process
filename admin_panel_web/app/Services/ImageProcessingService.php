<?php

namespace App\Services;

use App\Models\Background;
use App\Models\ProcessingLog;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ImageProcessingService
{
    public function dimensions(string $orientation): array
    {
        $key = $orientation === 'horizontal' ? 'horizontal' : 'vertical';

        return config("images.{$key}");
    }

    public function storeUpload(UploadedFile $file, string $folder = 'products/original'): string
    {
        $this->assertValidImage($file);
        $name = Str::uuid().'.'.$file->getClientOriginalExtension();

        return $file->storeAs($folder, $name, 'public');
    }

    public function fitBackground(UploadedFile $file, string $orientation): array
    {
        $this->assertValidImage($file);
        $dims = $this->dimensions($orientation);
        $name = Str::uuid().'.png';
        $relative = 'backgrounds/'.$name;
        $abs = Storage::disk('public')->path($relative);

        Storage::disk('public')->makeDirectory('backgrounds');

        try {
            $base = rtrim((string) config('images.process_url'), '/');
            $response = Http::timeout(120)
                ->attach('image', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                ->post($base.'/fit-background', [
                    'width' => $dims['width'],
                    'height' => $dims['height'],
                ]);
            if ($response->successful() && $response->body()) {
                file_put_contents($abs, $response->body());

                return [
                    'path' => $relative,
                    'width' => $dims['width'],
                    'height' => $dims['height'],
                ];
            }
        } catch (\Throwable) {
            // Fall through to raw store when the Python service is offline.
        }

        $file->storeAs('backgrounds', $name, 'public');

        return [
            'path' => $relative,
            'width' => $dims['width'],
            'height' => $dims['height'],
        ];
    }

    public function processProductImage(
        ProductImage $image,
        ?Background $background,
        bool $keepOriginal,
        ?int $userId = null,
        string $source = 'web'
    ): ProductImage {
        if ($keepOriginal) {
            $image->update([
                'processed_path' => $image->original_path,
                'is_processed' => false,
                'background_id' => null,
            ]);

            return $image->fresh();
        }

        if (! $background) {
            throw new RuntimeException('A background is required when Keep As Original is off.');
        }

        $cutout = $this->removeBackground($image->original_path);
        $composite = $this->composite($cutout, $background);

        Storage::disk('public')->put($composite['path'], $composite['bytes']);
        @unlink($cutout);

        $image->update([
            'processed_path' => $composite['path'],
            'is_processed' => true,
            'background_id' => $background->id,
        ]);

        ProcessingLog::query()->create([
            'user_id' => $userId,
            'image_count' => 1,
            'source' => $source,
            'processed_at' => now(),
        ]);

        return $image->fresh();
    }

    public function processUploadedFile(
        UploadedFile $file,
        Background $background,
        string $orientation,
        ?int $userId = null,
        string $source = 'app'
    ): array {
        $original = $this->storeUpload($file, 'processing/original');
        $cutout = $this->removeBackground($original);
        $composite = $this->composite($cutout, $background, $orientation);
        Storage::disk('public')->put($composite['path'], $composite['bytes']);
        @unlink($cutout);

        ProcessingLog::query()->create([
            'user_id' => $userId,
            'image_count' => 1,
            'source' => $source,
            'processed_at' => now(),
        ]);

        return [
            'original_path' => $original,
            'processed_path' => $composite['path'],
            'background_id' => $background->id,
        ];
    }

    private function removeBackground(string $relativePath): string
    {
        $abs = Storage::disk('public')->path($relativePath);
        $url = (string) config('images.rembg_url');
        $tmp = sys_get_temp_dir().DIRECTORY_SEPARATOR.Str::uuid().'.png';

        try {
            $response = Http::timeout(180)
                ->attach('image', file_get_contents($abs), basename($abs))
                ->post($url);
            if ($response->successful() && $response->body()) {
                file_put_contents($tmp, $response->body());

                return $tmp;
            }
        } catch (\Throwable) {
            // Keep original pixels if rembg is unavailable.
        }

        copy($abs, $tmp);

        return $tmp;
    }

    private function composite(string $cutoutPath, Background $background, ?string $orientation = null): array
    {
        $orientation = $orientation ?: $background->orientation;
        $dims = $this->dimensions($orientation);
        $bgAbs = Storage::disk('public')->path($background->image_path);
        $name = 'products/processed/'.Str::uuid().'.png';
        Storage::disk('public')->makeDirectory('products/processed');

        try {
            $base = rtrim((string) config('images.process_url'), '/');
            $response = Http::timeout(180)
                ->attach('cutout', file_get_contents($cutoutPath), 'cutout.png')
                ->attach('background', file_get_contents($bgAbs), 'bg.png')
                ->post($base.'/composite', [
                    'width' => $dims['width'],
                    'height' => $dims['height'],
                ]);
            if ($response->successful() && $response->body()) {
                return [
                    'path' => $name,
                    'bytes' => $response->body(),
                ];
            }
        } catch (\Throwable) {
            // Fall back to the cutout file.
        }

        return [
            'path' => $name,
            'bytes' => file_get_contents($cutoutPath),
        ];
    }

    private function assertValidImage(UploadedFile $file): void
    {
        $maxKb = (int) config('images.max_upload_kb');
        if ($file->getSize() > $maxKb * 1024) {
            throw new RuntimeException("Image exceeds {$maxKb} KB limit.");
        }

        $mime = $file->getMimeType();
        if (! in_array($mime, config('images.allowed_mimes'), true)) {
            throw new RuntimeException('Unsupported image type. Use JPEG, PNG, or WebP.');
        }
    }
}
