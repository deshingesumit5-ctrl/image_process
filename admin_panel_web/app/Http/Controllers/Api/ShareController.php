<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ShareHistory;
use App\Services\CaptionService;
use Illuminate\Http\Request;

class ShareController extends Controller
{
    public function captions(Request $request, CaptionService $captions)
    {
        $data = $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ]);

        $products = Product::query()->with(['sizes', 'images'])->whereIn('id', $data['product_ids'])->get();
        $text = $products->map(fn (Product $p) => $captions->forProduct($p))->implode("\n\n");
        $images = $products->flatMap(function (Product $product) {
            return $product->images->map(fn ($img) => asset('storage/'.$img->displayPath()));
        })->values();

        return response()->json([
            'caption' => $text,
            'images' => $images,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['integer'],
            'shared_via' => ['nullable', 'string', 'max:40'],
        ]);

        $history = ShareHistory::query()->create([
            'user_id' => $request->user()->id,
            'product_ids' => $data['product_ids'],
            'shared_via' => $data['shared_via'] ?? 'whatsapp',
            'shared_at' => now(),
        ]);

        return response()->json(['data' => $history], 201);
    }
}
