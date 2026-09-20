<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Background;
use App\Models\ProcessingLog;
use App\Models\ProductImage;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;

class ProcessController extends Controller
{
    public function recent(Request $request)
    {
        $logs = ProcessingLog::query()
            ->where('user_id', $request->user()->id)
            ->latest('processed_at')
            ->limit(10)
            ->get();

        return response()->json(['data' => $logs]);
    }

    public function store(Request $request, ImageProcessingService $processor)
    {
        $data = $request->validate([
            'background_id' => ['required', 'exists:backgrounds,id'],
            'orientation' => ['nullable', 'in:horizontal,vertical'],
            'product_image_ids' => ['nullable'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'apply_to_all' => ['nullable', 'boolean'],
        ]);

        $ids = $data['product_image_ids'] ?? [];
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $background = Background::query()->findOrFail($data['background_id']);
        $results = [];

        if (! empty($ids)) {
            $images = ProductImage::query()->with('product')->whereIn('id', $ids)->get();
            foreach ($images as $image) {
                $processed = $processor->processProductImage(
                    $image,
                    $background,
                    (bool) $image->product?->keep_original,
                    $request->user()->id,
                    'app'
                );
                $results[] = [
                    'id' => $processed->id,
                    'url' => asset('storage/'.$processed->displayPath()),
                ];
            }
        }

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $saved = $processor->processUploadedFile(
                    $file,
                    $background,
                    $data['orientation'] ?? $background->orientation,
                    $request->user()->id,
                    'app'
                );
                $results[] = [
                    'url' => asset('storage/'.$saved['processed_path']),
                    'original_url' => asset('storage/'.$saved['original_path']),
                ];
            }
        }

        return response()->json(['data' => $results]);
    }
}
