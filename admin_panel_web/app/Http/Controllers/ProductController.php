<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\SubCategory;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $products = Product::query()
            ->with(['category', 'subCategory', 'images', 'sizes'])
            ->when($q, function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->where('name', 'like', "%{$q}%")
                        ->orWhere('design_number', 'like', "%{$q}%")
                        ->orWhere('barcode', 'like', "%{$q}%");
                });
            })
            ->latest('id')
            ->paginate(12)
            ->withQueryString();

        return view('products.index', compact('products', 'q'));
    }

    public function create()
    {
        return view('products.form', [
            'product' => new Product(['status' => true, 'orientation' => 'vertical']),
            'categories' => Category::query()->where('status', true)->orderBy('name')->get(),
            'subCategories' => SubCategory::query()->where('status', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, ImageProcessingService $processor)
    {
        $product = $this->persist($request, new Product, $processor);

        return redirect()->route('products.edit', $product)->with('success', 'Product created.');
    }

    public function edit(Product $product)
    {
        $product->load(['images', 'sizes']);

        return view('products.form', [
            'product' => $product,
            'categories' => Category::query()->orderBy('name')->get(),
            'subCategories' => SubCategory::query()->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Product $product, ImageProcessingService $processor)
    {
        $this->persist($request, $product, $processor);

        return redirect()->route('products.edit', $product)->with('success', 'Product updated.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index')->with('success', 'Product deleted.');
    }

    public function destroyImage(Product $product, ProductImage $image)
    {
        abort_unless($image->product_id === $product->id, 404);
        Storage::disk('public')->delete(array_filter([$image->original_path, $image->processed_path]));
        $image->delete();

        return back()->with('success', 'Image deleted.');
    }

    private function persist(Request $request, Product $product, ImageProcessingService $processor): Product
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'sub_category_id' => ['required', 'exists:sub_categories,id'],
            'name' => ['required', 'string', 'max:160'],
            'design_number' => ['nullable', 'string', 'max:80'],
            'barcode' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', 'boolean'],
            'keep_original' => ['nullable', 'boolean'],
            'orientation' => ['required', 'in:horizontal,vertical'],
            'sizes' => ['nullable', 'array'],
            'sizes.*.size' => ['nullable', 'string', 'max:20'],
            'sizes.*.rate' => ['nullable', 'numeric', 'min:0'],
            'images.*' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        return DB::transaction(function () use ($data, $request, $product, $processor) {
            $product->fill([
                'category_id' => $data['category_id'],
                'sub_category_id' => $data['sub_category_id'],
                'name' => $data['name'],
                'design_number' => $data['design_number'] ?? null,
                'barcode' => $data['barcode'] ?? null,
                'status' => $request->boolean('status'),
                'keep_original' => $request->boolean('keep_original'),
                'orientation' => $data['orientation'],
            ]);
            $product->save();

            $product->sizes()->delete();
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
                    $path = $processor->storeUpload($file);
                    $product->images()->create([
                        'original_path' => $path,
                        'processed_path' => $product->keep_original ? $path : null,
                        'is_processed' => false,
                    ]);
                }
            }

            return $product;
        });
    }
}
