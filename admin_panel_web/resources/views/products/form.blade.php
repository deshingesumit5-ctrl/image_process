<x-layouts.app :title="$product->exists ? 'Edit Product' : 'Add Product'">
    <form method="POST" enctype="multipart/form-data" action="{{ $product->exists ? route('products.update', $product) : route('products.store') }}" class="space-y-6">
        @csrf
        @if($product->exists) @method('PUT') @endif
        <div class="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
            <div>
                <label class="mb-1 block text-sm">Category</label>
                <select name="category_id" class="w-full rounded-lg border px-3 py-2" required>
                    @foreach($categories as $category)
                        <option value="{{ $category->id }}" @selected(old('category_id', $product->category_id) == $category->id)>{{ $category->name }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="mb-1 block text-sm">Sub-Category</label>
                <select name="sub_category_id" class="w-full rounded-lg border px-3 py-2" required>
                    @foreach($subCategories as $sub)
                        <option value="{{ $sub->id }}" @selected(old('sub_category_id', $product->sub_category_id) == $sub->id)>{{ $sub->name }} ({{ $sub->category?->name }})</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="mb-1 block text-sm">Product Name</label>
                <input name="name" value="{{ old('name', $product->name) }}" class="w-full rounded-lg border px-3 py-2" required>
            </div>
            <div>
                <label class="mb-1 block text-sm">Design Number</label>
                <input name="design_number" value="{{ old('design_number', $product->design_number) }}" class="w-full rounded-lg border px-3 py-2">
            </div>
            <div>
                <label class="mb-1 block text-sm">Barcode</label>
                <input name="barcode" value="{{ old('barcode', $product->barcode) }}" class="w-full rounded-lg border px-3 py-2">
            </div>
            <div>
                <label class="mb-1 block text-sm">Orientation</label>
                <select name="orientation" class="w-full rounded-lg border px-3 py-2">
                    <option value="vertical" @selected(old('orientation', $product->orientation) === 'vertical')>Vertical</option>
                    <option value="horizontal" @selected(old('orientation', $product->orientation) === 'horizontal')>Horizontal</option>
                </select>
            </div>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="status" value="1" @checked(old('status', $product->status))> Active</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="keep_original" value="1" @checked(old('keep_original', $product->keep_original))> Keep As Original (skip processing)</label>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="mb-3 font-semibold">Sizes & Rates</h2>
            <div id="size-rows" class="space-y-2">
                @php $sizeRows = old('sizes', $product->sizes?->toArray() ?: [['size'=>'M','rate'=>450]]); @endphp
                @foreach($sizeRows as $i => $row)
                    <div class="flex gap-2">
                        <input name="sizes[{{ $i }}][size]" value="{{ $row['size'] ?? '' }}" placeholder="Size" class="rounded-lg border px-3 py-2">
                        <input name="sizes[{{ $i }}][rate]" value="{{ $row['rate'] ?? '' }}" placeholder="Rate" class="rounded-lg border px-3 py-2">
                    </div>
                @endforeach
            </div>
            <button type="button" onclick="addSize()" class="mt-3 text-sm text-indigo-600">Add More</button>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="mb-3 font-semibold">Images</h2>
            <input type="file" name="images[]" multiple accept="image/*" class="mb-4">
            <div class="grid grid-cols-4 gap-3">
                @foreach($product->images ?? [] as $image)
                    <div class="rounded-xl border p-2">
                        <img src="{{ asset('storage/'.$image->displayPath()) }}" class="h-32 w-full rounded object-cover">
                        <form method="POST" action="{{ route('products.images.destroy', [$product, $image]) }}">@csrf @method('DELETE')<button class="mt-2 text-xs text-rose-600">Delete</button></form>
                    </div>
                @endforeach
            </div>
        </div>
        <button class="rounded-lg bg-indigo-600 px-5 py-2 text-white">Save Product</button>
    </form>
    <script>
        let i = {{ count($sizeRows ?? [1]) }};
        function addSize() {
            const wrap = document.getElementById('size-rows');
            const div = document.createElement('div');
            div.className = 'flex gap-2';
            div.innerHTML = `<input name="sizes[${i}][size]" placeholder="Size" class="rounded-lg border px-3 py-2"><input name="sizes[${i}][rate]" placeholder="Rate" class="rounded-lg border px-3 py-2">`;
            wrap.appendChild(div); i++;
        }
    </script>
</x-layouts.app>
