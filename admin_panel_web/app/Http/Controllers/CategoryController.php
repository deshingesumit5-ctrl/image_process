<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $categories = Category::query()
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return view('categories.index', compact('categories', 'q'));
    }

    public function create()
    {
        return view('categories.form', ['category' => new Category(['status' => true])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'status' => ['nullable', 'boolean'],
        ]);
        $data['status'] = $request->boolean('status');
        Category::query()->create($data);

        return redirect()->route('categories.index')->with('success', 'Category created.');
    }

    public function edit(Category $category)
    {
        return view('categories.form', compact('category'));
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'status' => ['nullable', 'boolean'],
        ]);
        $data['status'] = $request->boolean('status');
        $category->update($data);

        return redirect()->route('categories.index')->with('success', 'Category updated.');
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return redirect()->route('categories.index')->with('success', 'Category deleted.');
    }

    public function toggle(Category $category)
    {
        $category->update(['status' => ! $category->status]);

        return back()->with('success', 'Category status updated.');
    }
}
