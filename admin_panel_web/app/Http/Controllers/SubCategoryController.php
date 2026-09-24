<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubCategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $categoryId = $request->input('category_id');
        $status = $request->input('status');
        $perPage = (int) $request->input('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        $subCategories = SubCategory::query()
            ->with('category')
            ->withCount('products')
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->when($categoryId, fn ($query) => $query->where('category_id', $categoryId))
            ->when($status !== null && $status !== '', fn ($query) => $query->where('status', (bool)$status))
            ->orderBy('display_order', 'asc')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        $categories = Category::query()->orderBy('name')->get();

        return view('sub-categories.index', compact('subCategories', 'categories', 'q', 'categoryId', 'status', 'perPage'));
    }

    public function create()
    {
        return view('sub-categories.form', [
            'subCategory' => new SubCategory(['status' => true, 'display_order' => 1]),
            'categories' => Category::query()->where('status', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'display_order' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $data['status'] = $request->boolean('status');
        $data['display_order'] = $data['display_order'] ?? 1;

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('sub-categories', 'public');
        }

        SubCategory::query()->create($data);

        return redirect()->route('sub-categories.index')->with('success', 'Sub-category created successfully.');
    }

    public function edit(SubCategory $sub_category)
    {
        return view('sub-categories.form', [
            'subCategory' => $sub_category,
            'categories' => Category::query()->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, SubCategory $sub_category)
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'display_order' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $data['status'] = $request->boolean('status');
        $data['display_order'] = $data['display_order'] ?? 1;

        if ($request->hasFile('image')) {
            if ($sub_category->image_path) {
                Storage::disk('public')->delete($sub_category->image_path);
            }
            $data['image_path'] = $request->file('image')->store('sub-categories', 'public');
        }

        $sub_category->update($data);

        return redirect()->route('sub-categories.index')->with('success', 'Sub-category updated successfully.');
    }

    public function destroy(SubCategory $sub_category)
    {
        if ($sub_category->image_path) {
            Storage::disk('public')->delete($sub_category->image_path);
        }
        $sub_category->delete();

        return redirect()->route('sub-categories.index')->with('success', 'Sub-category deleted successfully.');
    }

    public function toggle(SubCategory $sub_category)
    {
        $sub_category->update(['status' => ! $sub_category->status]);

        return back()->with('success', 'Sub-category status updated.');
    }
}
