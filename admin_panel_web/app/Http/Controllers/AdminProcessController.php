<?php

namespace App\Http\Controllers;

use App\Models\Background;
use App\Models\Product;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;

class AdminProcessController extends Controller
{
    public function create(Product $product)
    {
        $product->load('images');
        $backgrounds = Background::query()
            ->where('status', true)
            ->where('orientation', $product->orientation)
            ->latest('id')
            ->get();

        return view('process.create', compact('product', 'backgrounds'));
    }

    public function store(Request $request, Product $product, ImageProcessingService $processor)
    {
        $data = $request->validate([
            'background_id' => ['required', 'exists:backgrounds,id'],
            'image_ids' => ['required', 'array'],
            'image_ids.*' => ['integer'],
        ]);

        $background = Background::query()->findOrFail($data['background_id']);
        $images = $product->images()->whereIn('id', $data['image_ids'])->get();

        foreach ($images as $image) {
            $processor->processProductImage(
                $image,
                $background,
                $product->keep_original,
                $request->user()->id,
                'web'
            );
        }

        return redirect()->route('products.edit', $product)->with('success', 'Images processed.');
    }
}
