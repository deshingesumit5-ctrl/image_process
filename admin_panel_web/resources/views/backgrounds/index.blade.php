<x-layouts.app title="Backgrounds">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form class="flex gap-2">
            <input name="q" value="{{ $q }}" class="rounded-lg border px-3 py-2" placeholder="Search">
            <select name="orientation" class="rounded-lg border px-3 py-2">
                <option value="">All orientations</option>
                <option value="vertical" @selected($orientation==='vertical')>Vertical</option>
                <option value="horizontal" @selected($orientation==='horizontal')>Horizontal</option>
            </select>
            <button class="rounded-lg bg-slate-800 px-4 py-2 text-white">Filter</button>
        </form>
        <a href="{{ route('backgrounds.create') }}" class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Add Background</a>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
        @foreach($backgrounds as $bg)
            <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
                <img src="{{ asset('storage/'.$bg->image_path) }}" class="h-40 w-full object-cover">
                <div class="p-4">
                    <p class="font-medium">{{ $bg->name }}</p>
                    <p class="text-sm text-slate-500">{{ $bg->category_type }} · {{ $bg->orientation }} · {{ $bg->width }}×{{ $bg->height }}</p>
                    <div class="mt-3 flex gap-3 text-sm">
                        <form method="POST" action="{{ route('backgrounds.toggle', $bg) }}">@csrf<button class="text-indigo-600">{{ $bg->status ? 'Deactivate' : 'Activate' }}</button></form>
                        <a class="text-indigo-600" href="{{ route('backgrounds.edit', $bg) }}">Edit</a>
                        <form method="POST" action="{{ route('backgrounds.destroy', $bg) }}" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="text-rose-600">Delete</button></form>
                    </div>
                </div>
            </div>
        @endforeach
    </div>
    <div class="mt-4">{{ $backgrounds->links() }}</div>
</x-layouts.app>
