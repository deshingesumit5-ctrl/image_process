<x-layouts.app :title="$subCategory->exists ? 'Edit Sub-Category' : 'Add Sub-Category'">
    <form method="POST" action="{{ $subCategory->exists ? route('sub-categories.update', $subCategory) : route('sub-categories.store') }}" class="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        @csrf
        @if($subCategory->exists) @method('PUT') @endif
        <div>
            <label class="mb-1 block text-sm">Category</label>
            <select name="category_id" class="w-full rounded-lg border px-3 py-2" required>
                @foreach($categories as $category)
                    <option value="{{ $category->id }}" @selected(old('category_id', $subCategory->category_id) == $category->id)>{{ $category->name }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="mb-1 block text-sm">Name</label>
            <input name="name" value="{{ old('name', $subCategory->name) }}" class="w-full rounded-lg border px-3 py-2" required>
        </div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="status" value="1" @checked(old('status', $subCategory->status))> Active</label>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save</button>
    </form>
</x-layouts.app>
