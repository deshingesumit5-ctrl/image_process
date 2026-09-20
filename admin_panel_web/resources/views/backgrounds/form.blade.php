<x-layouts.app :title="$background->exists ? 'Edit Background' : 'Add Background'">
    <form method="POST" enctype="multipart/form-data" action="{{ $background->exists ? route('backgrounds.update', $background) : route('backgrounds.store') }}" class="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        @csrf
        @if($background->exists) @method('PUT') @endif
        <div><label class="mb-1 block text-sm">Name</label><input name="name" value="{{ old('name', $background->name) }}" class="w-full rounded-lg border px-3 py-2" required></div>
        <div><label class="mb-1 block text-sm">Category / Type</label>
            <select name="category_type" class="w-full rounded-lg border px-3 py-2">
                @foreach(['White','Studio','Wood','Gradient','Wall','Custom'] as $type)
                    <option value="{{ $type }}" @selected(old('category_type', $background->category_type)===$type)>{{ $type }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="mb-1 block text-sm">Orientation</label>
            <select name="orientation" class="w-full rounded-lg border px-3 py-2">
                <option value="vertical" @selected(old('orientation', $background->orientation)==='vertical')>Vertical (1200×1600)</option>
                <option value="horizontal" @selected(old('orientation', $background->orientation)==='horizontal')>Horizontal (1600×1200)</option>
            </select>
        </div>
        <div><label class="mb-1 block text-sm">Image</label><input type="file" name="image" accept="image/*" class="w-full"></div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="status" value="1" @checked(old('status', $background->status))> Active</label>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save</button>
    </form>
</x-layouts.app>
