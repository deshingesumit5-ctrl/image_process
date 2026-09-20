<x-layouts.app title="Sub-Categories">
    <div class="mb-4 flex items-center justify-between">
        <form class="flex gap-2"><input name="q" value="{{ $q }}" class="rounded-lg border px-3 py-2" placeholder="Search"><button class="rounded-lg bg-slate-800 px-4 py-2 text-white">Search</button></form>
        <a href="{{ route('sub-categories.create') }}" class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Add Sub-Category</a>
    </div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50"><tr><th class="px-4 py-3">Name</th><th>Category</th><th>Status</th><th></th></tr></thead>
            <tbody>
            @foreach($subCategories as $row)
                <tr class="border-t">
                    <td class="px-4 py-3">{{ $row->name }}</td>
                    <td>{{ $row->category?->name }}</td>
                    <td>{{ $row->status ? 'Active' : 'Inactive' }}</td>
                    <td class="px-4 py-3 text-right space-x-2">
                        <a class="text-indigo-600" href="{{ route('sub-categories.edit', $row) }}">Edit</a>
                        <form class="inline" method="POST" action="{{ route('sub-categories.destroy', $row) }}" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="text-rose-600">Delete</button></form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
        <div class="p-4">{{ $subCategories->links() }}</div>
    </div>
</x-layouts.app>
