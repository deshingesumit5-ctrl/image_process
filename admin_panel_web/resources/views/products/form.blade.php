<x-layouts.app :title="$product->exists ? 'Edit Product - Admin Panel Web' : 'Add Product - Admin Panel Web'">
    <div class="mb-6 flex items-center justify-between">
        <div>
            <div class="text-emerald-600 font-medium text-xs tracking-wider uppercase flex items-center gap-1.5 mb-1">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                Catalog Master
            </div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ $product->exists ? 'Edit Product' : 'Add New Product' }}</h1>
        </div>
        <a href="{{ route('products.index') }}" class="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            &larr; Back to Product Master
        </a>
    </div>

    <form method="POST" enctype="multipart/form-data" action="{{ $product->exists ? route('products.update', $product) : route('products.store') }}" class="space-y-6">
        @csrf
        @if($product->exists) @method('PUT') @endif

        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Basic Information</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Category <span class="text-rose-500">*</span></label>
                    <select name="category_id" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" required>
                        @foreach($categories as $category)
                            <option value="{{ $category->id }}" @selected(old('category_id', $product->category_id) == $category->id)>{{ $category->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Sub-Category <span class="text-rose-500">*</span></label>
                    <select name="sub_category_id" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" required>
                        @foreach($subCategories as $sub)
                            <option value="{{ $sub->id }}" @selected(old('sub_category_id', $product->sub_category_id) == $sub->id)>{{ $sub->name }} ({{ $sub->category?->name }})</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Name <span class="text-rose-500">*</span></label>
                <input name="name" value="{{ old('name', $product->name) }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" required placeholder="e.g. Traffic Shorts">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Design Number</label>
                    <input name="design_number" value="{{ old('design_number', $product->design_number) }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. 92093">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Barcode</label>
                    <input name="barcode" value="{{ old('barcode', $product->barcode) }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. 890123456">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Display Order</label>
                    <input type="number" name="display_order" value="{{ old('display_order', $product->display_order ?? 1) }}" min="1" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Keep As Original</label>
                    <select name="keep_original" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                        <option value="0" @selected(!old('keep_original', $product->keep_original))>No (Process Background)</option>
                        <option value="1" @selected(old('keep_original', $product->keep_original))>Yes (Keep Original Image)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Orientation</label>
                    <select name="orientation" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                        <option value="vertical" @selected(old('orientation', $product->orientation) === 'vertical')>Vertical</option>
                        <option value="horizontal" @selected(old('orientation', $product->orientation) === 'horizontal')>Horizontal</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
                    <label class="flex items-center gap-2 cursor-pointer mt-2">
                        <input type="checkbox" name="status" value="1" @checked(old('status', $product->status)) class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
                        <span class="text-sm font-medium text-slate-700">Active</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-base font-bold text-slate-900">Sizes & Rates</h2>
                <button type="button" onclick="addSize()" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700">+ Add More Size</button>
            </div>
            <div id="size-rows" class="space-y-2">
                @php $sizeRows = old('sizes', $product->sizes?->toArray() ?: [['size'=>'M','rate'=>450]]); @endphp
                @foreach($sizeRows as $i => $row)
                    <div class="flex items-center gap-3">
                        <input name="sizes[{{ $i }}][size]" value="{{ $row['size'] ?? '' }}" placeholder="Size (e.g. M, L, XL)" class="w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                        <input name="sizes[{{ $i }}][rate]" value="{{ $row['rate'] ?? '' }}" placeholder="Rate (₹)" class="w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500">
                    </div>
                @endforeach
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h2 class="text-base font-bold text-slate-900 mb-3">Product Images</h2>
            <input type="file" name="images[]" multiple accept="image/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition mb-4">
            
            @if(!empty($product->images) && count($product->images) > 0)
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    @foreach($product->images as $image)
                        <div class="rounded-xl border border-slate-200 p-2 relative group bg-slate-50">
                            <img src="{{ asset('storage/'.$image->displayPath()) }}" class="h-36 w-full rounded-lg object-cover">
                            <div class="mt-2 text-right">
                                <a href="{{ route('products.images.destroy', [$product, $image]) }}" 
                                   onclick="event.preventDefault(); if(confirm('Delete image?')) document.getElementById('del-img-{{ $image->id }}').submit();" 
                                   class="text-xs text-rose-600 font-semibold hover:underline">
                                    Delete Image
                                </a>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>

        <div class="flex items-center justify-end space-x-3">
            <a href="{{ route('products.index') }}" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">Cancel</a>
            <button type="submit" class="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold text-sm shadow-sm transition">
                Save Product
            </button>
        </div>
    </form>

    @foreach($product->images ?? [] as $image)
        <form id="del-img-{{ $image->id }}" method="POST" action="{{ route('products.images.destroy', [$product, $image]) }}" class="hidden">
            @csrf
            @method('DELETE')
        </form>
    @endforeach

    <script>
        let i = {{ count($sizeRows ?? [1]) }};
        function addSize() {
            const wrap = document.getElementById('size-rows');
            const div = document.createElement('div');
            div.className = 'flex items-center gap-3';
            div.innerHTML = `<input name="sizes[${i}][size]" placeholder="Size (e.g. M, L, XL)" class="w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"><input name="sizes[${i}][rate]" placeholder="Rate (₹)" class="w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500">`;
            wrap.appendChild(div); i++;
        }
    </script>
</x-layouts.app>
