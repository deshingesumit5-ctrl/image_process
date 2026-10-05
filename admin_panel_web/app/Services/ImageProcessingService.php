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

    public function cutoutUploadedFile(UploadedFile $file): array
    {
        $original = $this->storeUpload($file, 'processing/original');
        $tmp = $this->removeBackground($original);
        $relative = 'processing/cutout/'.Str::uuid().'.png';
        Storage::disk('public')->makeDirectory('processing/cutout');
        Storage::disk('public')->put($relative, file_get_contents($tmp) ?: '');
        @unlink($tmp);

        return [
            'original_path' => $original,
            'cutout_path' => $relative,
        ];
    }

    public function processUploadedFile(
        UploadedFile $file,
        Background $background,
        string $orientation,
         ?int $userId = null,
        string $source = 'app',
        bool $isCutout = false
    ): array {
        $original = $this->storeUpload($file, 'processing/original');

        if ($isCutout) {
            // Copy to a temp file: composite() callers @unlink the cutout,
            // and we must not delete the stored original.
            $cutout = sys_get_temp_dir().DIRECTORY_SEPARATOR.Str::uuid().'.png';
            copy(Storage::disk('public')->path($original), $cutout);
        } else {
            $cutout = $this->removeBackground($original);
        }

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
        $contents = file_get_contents($abs);
        $filename = basename($abs);

        try {
            $response = Http::timeout(180)
                ->attach('image', $contents, $filename)
                ->attach('file', $contents, $filename)
                ->post($url);

            if (! $response->successful()) {
                $baseUrl = rtrim((string) config('images.process_url', 'http://127.0.0.1:8001'), '/');
                $candidates = [
                    $baseUrl.'/remove',
                    $baseUrl.'/api/remove',
                ];
                foreach ($candidates as $candidateUrl) {
                    if ($candidateUrl !== $url) {
                        $fallback = Http::timeout(180)
                            ->attach('image', $contents, $filename)
                            ->attach('file', $contents, $filename)
                            ->post($candidateUrl);
                        if ($fallback->successful() && $fallback->body()) {
                            $response = $fallback;
                            break;
                        }
                    }
                }
            }

            if ($response->successful() && $response->body()) {
                file_put_contents($tmp, $response->body());

                return $tmp;
            }

            if (! $response->successful()) {
                throw new RuntimeException("Service returned HTTP {$response->status()}: ".$response->body());
            }
        } catch (\Throwable $e) {
            throw new RuntimeException('Background removal failed: '.$e->getMessage());
        }

        throw new RuntimeException('Background removal returned no image.');
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
            throw new RuntimeException('Unsupported image type.');
        }
    }
}
