<x-layouts.app :title="$category->exists ? 'Edit Category' : 'Add Category'">
    <form method="POST" action="{{ $category->exists ? route('categories.update', $category) : route('categories.store') }}" class="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        @csrf
        @if($category->exists) @method('PUT') @endif
        <div>
            <label class="mb-1 block text-sm">Name</label>
            <input name="name" value="{{ old('name', $category->name) }}" class="w-full rounded-lg border px-3 py-2" required>
        </div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="status" value="1" @checked(old('status', $category->status))> Active</label>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save</button>
    </form>
</x-layouts.app>
