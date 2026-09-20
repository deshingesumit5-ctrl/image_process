<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Shortlist;
use Illuminate\Http\Request;

class ShortlistController extends Controller
{
    public function show(Request $request)
    {
        $shortlist = $this->current($request);
        $shortlist->load(['items.product.images', 'items.product.sizes', 'items.productImage']);

        return response()->json([
            'id' => $shortlist->id,
            'count' => $shortlist->items->count(),
            'items' => $shortlist->items->map(function ($item) {
                $product = $item->product;
                $image = $item->productImage ?: $product?->images->first();

                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_image_id' => $item->product_image_id,
                    'name' => $product?->name,
                    'design_number' => $product?->design_number,
                    'thumbnail' => $image ? asset('storage/'.$image->displayPath()) : null,
                ];
            }),
        ]);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_image_id' => ['nullable', 'exists:product_images,id'],
        ]);

        $shortlist = $this->current($request);
        foreach ($data['items'] as $row) {
            $product = Product::query()->find($row['product_id']);
            $imageId = $row['product_image_id'] ?? $product?->images()->value('id');
            $shortlist->items()->firstOrCreate([
                'product_id' => $row['product_id'],
                'product_image_id' => $imageId,
            ]);
        }

        return $this->show($request);
    }

    public function remove(Request $request)
    {
        $data = $request->validate([
            'item_ids' => ['required', 'array'],
            'item_ids.*' => ['integer'],
        ]);
        $this->current($request)->items()->whereIn('id', $data['item_ids'])->delete();

        return $this->show($request);
    }

    public function empty(Request $request)
    {
        $this->current($request)->items()->delete();

        return $this->show($request);
    }

    private function current(Request $request): Shortlist
    {
        return Shortlist::query()->firstOrCreate(['user_id' => $request->user()->id]);
    }
}
