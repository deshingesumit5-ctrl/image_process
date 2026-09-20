<x-layouts.app title="Categories">
    <div class="mb-4 flex items-center justify-between">
        <form class="flex gap-2">
            <input name="q" value="{{ $q }}" placeholder="Search category" class="rounded-lg border px-3 py-2">
            <button class="rounded-lg bg-slate-800 px-4 py-2 text-white">Search</button>
        </form>
        @if(!empty($menuPermissions['category']['add'] ?? auth()->user()->canModule('category','add')))
            <a href="{{ route('categories.create') }}" class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Add Category</a>
        @endif
    </div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500"><tr><th class="px-4 py-3">Name</th><th>Status</th><th></th></tr></thead>
            <tbody>
            @foreach($categories as $category)
                <tr class="border-t">
                    <td class="px-4 py-3">{{ $category->name }}</td>
                    <td>{{ $category->status ? 'Active' : 'Inactive' }}</td>
                    <td class="px-4 py-3 text-right space-x-2">
                        <form class="inline" method="POST" action="{{ route('categories.toggle', $category) }}">@csrf<button class="text-indigo-600">Toggle</button></form>
                        <a class="text-indigo-600" href="{{ route('categories.edit', $category) }}">Edit</a>
                        <form class="inline" method="POST" action="{{ route('categories.destroy', $category) }}" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="text-rose-600">Delete</button></form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
        <div class="p-4">{{ $categories->links() }}</div>
    </div>
</x-layouts.app>
