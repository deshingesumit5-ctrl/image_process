<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\SubCategory;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function categories(Request $request)
    {
        $items = Category::query()
            ->where('status', true)
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->q.'%'))
            ->orderBy('name')
            ->paginate(30);

        return response()->json($items);
    }

    public function subCategories(Request $request, Category $category)
    {
        $items = SubCategory::query()
            ->where('category_id', $category->id)
            ->where('status', true)
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->q.'%'))
            ->orderBy('name')
            ->paginate(30);

        return response()->json($items);
    }

    public function products(Request $request)
    {
        $items = Product::query()
            ->with(['category', 'subCategory', 'sizes', 'images'])
            ->where('status', true)
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->filled('sub_category_id'), fn ($q) => $q->where('sub_category_id', $request->sub_category_id))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = $request->q;
                $q->where(function ($inner) use ($term) {
                    $inner->where('name', 'like', "%{$term}%")
                        ->orWhere('design_number', 'like', "%{$term}%")
                        ->orWhere('barcode', 'like', "%{$term}%")
                        ->orWhereHas('sizes', fn ($s) => $s->where('size', 'like', "%{$term}%"));
                });
            })
            ->latest('id')
            ->paginate(20)
            ->through(fn (Product $product) => $this->productPayload($product));

        return response()->json($items);
    }

    public function show(Product $product)
    {
        $product->load(['category', 'subCategory', 'sizes', 'images']);

        return response()->json(['data' => $this->productPayload($product)]);
    }

    private function productPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'design_number' => $product->design_number,
            'barcode' => $product->barcode,
            'orientation' => $product->orientation,
            'keep_original' => $product->keep_original,
            'category' => $product->category?->only(['id', 'name']),
            'sub_category' => $product->subCategory?->only(['id', 'name']),
            'sizes' => $product->sizes->map->only(['id', 'size', 'rate']),
            'images' => $product->images->map(fn ($img) => [
                'id' => $img->id,
                'url' => asset('storage/'.$img->displayPath()),
                'original_url' => asset('storage/'.$img->original_path),
                'is_processed' => $img->is_processed,
            ]),
        ];
    }
}
