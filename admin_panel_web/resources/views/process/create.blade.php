<x-layouts.app title="Process Images">
    <form method="POST" action="{{ route('products.process.store', $product) }}" class="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        @csrf
        <p class="text-sm text-slate-500">{{ $product->name }} · {{ $product->orientation }} · Keep original: {{ $product->keep_original ? 'Yes' : 'No' }}</p>
        <div>
            <label class="mb-1 block text-sm">Background (filtered by orientation)</label>
            <select name="background_id" class="w-full rounded-lg border px-3 py-2" required>
                @foreach($backgrounds as $bg)
                    <option value="{{ $bg->id }}">{{ $bg->name }} ({{ $bg->category_type }})</option>
                @endforeach
            </select>
        </div>
        <div class="grid grid-cols-4 gap-3">
            @foreach($product->images as $image)
                <label class="block rounded-xl border p-2">
                    <input type="checkbox" name="image_ids[]" value="{{ $image->id }}" checked>
                    <img src="{{ asset('storage/'.$image->displayPath()) }}" class="mt-2 h-28 w-full object-cover">
                </label>
            @endforeach
        </div>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Process selected</button>
    </form>
</x-layouts.app>
