<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Http\Request;

class SubCategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $subCategories = SubCategory::query()
            ->with('category')
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return view('sub-categories.index', compact('subCategories', 'q'));
    }

    public function create()
    {
        return view('sub-categories.form', [
            'subCategory' => new SubCategory(['status' => true]),
            'categories' => Category::query()->where('status', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'status' => ['nullable', 'boolean'],
        ]);
        $data['status'] = $request->boolean('status');
        SubCategory::query()->create($data);

        return redirect()->route('sub-categories.index')->with('success', 'Sub-category created.');
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
            'status' => ['nullable', 'boolean'],
        ]);
        $data['status'] = $request->boolean('status');
        $sub_category->update($data);

        return redirect()->route('sub-categories.index')->with('success', 'Sub-category updated.');
    }

    public function destroy(SubCategory $sub_category)
    {
        $sub_category->delete();

        return redirect()->route('sub-categories.index')->with('success', 'Sub-category deleted.');
    }
}
