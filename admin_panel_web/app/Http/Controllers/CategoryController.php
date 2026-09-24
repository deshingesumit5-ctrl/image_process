<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $status = $request->input('status');
        $perPage = (int) $request->input('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }

        $categories = Category::query()
            ->withCount(['subCategories', 'products'])
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->when($status !== null && $status !== '', fn ($query) => $query->where('status', (bool)$status))
            ->orderBy('display_order', 'asc')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return view('categories.index', compact('categories', 'q', 'status', 'perPage'));
    }

    public function create()
    {
        return view('categories.form', ['category' => new Category(['status' => true, 'display_order' => 1])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'display_order' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $data['status'] = $request->boolean('status');
        $data['display_order'] = $data['display_order'] ?? 1;

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('categories', 'public');
        }

        Category::query()->create($data);

        return redirect()->route('categories.index')->with('success', 'Category created successfully.');
    }

    public function edit(Category $category)
    {
        return view('categories.form', compact('category'));
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'display_order' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $data['status'] = $request->boolean('status');
        $data['display_order'] = $data['display_order'] ?? 1;

        if ($request->hasFile('image')) {
            if ($category->image_path) {
                Storage::disk('public')->delete($category->image_path);
            }
            $data['image_path'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);

        return redirect()->route('categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        if ($category->image_path) {
            Storage::disk('public')->delete($category->image_path);
        }
        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully.');
    }

    public function toggle(Category $category)
    {
        $category->update(['status' => ! $category->status]);

        return back()->with('success', 'Category status updated.');
    }
}
