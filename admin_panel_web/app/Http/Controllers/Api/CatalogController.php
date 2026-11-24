<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\SubCategory;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function store(Request $request, ImageProcessingService $processor)
    {
        if (is_string($request->input('sizes'))) {
            $decoded = json_decode($request->input('sizes'), true);
            if (is_array($decoded)) {
                $request->merge(['sizes' => $decoded]);
            }
        }

        $request->merge([
            'status' => $request->has('status') ? $request->boolean('status') : true,
            'keep_original' => $request->boolean('keep_original'),
        ]);

        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'sub_category_id' => ['required', 'exists:sub_categories,id'],
            'name' => ['required', 'string', 'max:160'],
            'design_number' => ['nullable', 'string', 'max:80'],
            'colour' => ['nullable', 'string', 'max:120'],
            'barcode' => ['nullable', 'string', 'max:80'],
            'display_order' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'boolean'],
            'keep_original' => ['nullable', 'boolean'],
            'orientation' => ['required', 'in:horizontal,vertical'],
            'sizes' => ['nullable', 'array'],
            'sizes.*.size' => ['nullable', 'string', 'max:20'],
            'sizes.*.rate' => ['nullable', 'numeric', 'min:0'],
            'images' => ['nullable', 'array'],
            'images.*' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif,bmp,avif,heic,heif,tif,tiff', 'max:20480'],
        ]);

        $product = DB::transaction(function () use ($data, $request, $processor) {
            $product = Product::create([
                'category_id' => $data['category_id'],
                'sub_category_id' => $data['sub_category_id'],
                'name' => $data['name'],
                'design_number' => $data['design_number'] ?? null,
                'colour' => $data['colour'] ?? null,
                'barcode' => $data['barcode'] ?? null,
                'display_order' => $data['display_order'] ?? 1,
                'status' => $request->boolean('status'),
                'keep_original' => $request->boolean('keep_original'),
                'orientation' => $data['orientation'],
            ]);

            foreach ($request->input('sizes', []) as $row) {
                if (empty($row['size'])) {
                    continue;
                }
                $product->sizes()->create([
                    'size' => $row['size'],
                    'rate' => $row['rate'] ?? 0,
                ]);
            }

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    if (! $file) {
                        continue;
                    }
                    $path = $processor->storeUpload($file, 'products/processed');
                    $product->images()->create([
                        'original_path' => $path,
                        'processed_path' => $path,
                        'is_processed' => true,
                    ]);
                }
            }

            return $product;
        });

        $product->load(['category', 'subCategory', 'sizes', 'images']);

        return response()->json([
            'data' => $this->productPayload($product),
            'message' => 'Product created successfully.',
        ], 201);
    }

    private function productPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'design_number' => $product->design_number,
            'colour' => $product->colour,
            'barcode' => $product->barcode,
            'display_order' => $product->display_order,
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
