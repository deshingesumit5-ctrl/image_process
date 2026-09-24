<x-layouts.app title="Product Master - Admin Panel Web">
    <div x-data="{ 
        showModal: false, 
        editMode: false,
        modalTitle: 'Add New Product',
        actionUrl: '{{ route('products.store') }}',
        prodId: null,
        categoryId: '{{ $categories->first()->id ?? '' }}',
        subCategoryId: '{{ $subCategories->first()->id ?? '' }}',
        name: '',
        designNumber: '',
        barcode: '',
        displayOrder: 1,
        status: true,
        keepOriginal: false,
        orientation: 'vertical',
        sizes: [{ size: 'M', rate: 450 }, { size: 'L', rate: 470 }, { size: 'XL', rate: 490 }],

        openCreateModal() {
            this.editMode = false;
            this.modalTitle = 'Add New Product';
            this.actionUrl = '{{ route('products.store') }}';
            this.prodId = null;
            this.name = '';
            this.designNumber = '';
            this.barcode = '';
            this.displayOrder = 1;
            this.status = true;
            this.keepOriginal = false;
            this.orientation = 'vertical';
            this.sizes = [{ size: 'M', rate: 450 }, { size: 'L', rate: 470 }, { size: 'XL', rate: 490 }];
            this.showModal = true;
        },

        openEditModal(p) {
            this.editMode = true;
            this.modalTitle = 'Edit Product';
            this.actionUrl = '{{ url('products') }}/' + p.id;
            this.prodId = p.id;
            this.categoryId = p.category_id;
            this.subCategoryId = p.sub_category_id;
            this.name = p.name;
            this.designNumber = p.design_number || '';
            this.barcode = p.barcode || '';
            this.displayOrder = p.display_order || 1;
            this.status = Boolean(p.status);
            this.keepOriginal = Boolean(p.keep_original);
            this.orientation = p.orientation || 'vertical';
            this.sizes = p.sizes && p.sizes.length ? p.sizes.map(s => ({ size: s.size, rate: s.rate })) : [{ size: 'M', rate: 450 }];
            this.showModal = true;
        },

        addSizeRow() {
            this.sizes.push({ size: '', rate: '' });
        },

        removeSizeRow(idx) {
            if (this.sizes.length > 1) {
                this.sizes.splice(idx, 1);
            }
        }
    }">

        <!-- Header Section matching Image 1 -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
                <!-- <div class="text-emerald-600 font-medium text-xs tracking-wider uppercase flex items-center gap-1.5 mb-1">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    Catalog Master
                </div> -->
                <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Product Master</h1>
                <p class="text-slate-500 text-sm mt-1">Maintain complete product information, design numbers, barcodes, sizes, rates, and catalog images.</p>
            </div>
            <div>
                <button @click="openCreateModal()" class="bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                     Add New Product
                </button>
            </div>
        </div>

        <!-- Filter & Search Bar matching Image 1 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
            <form method="GET" action="{{ route('products.index') }}" class="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div class="relative flex-1 w-full">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" name="q" value="{{ $q }}" placeholder="Search by product name, design no, barcode..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                </div>

                <div class="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
                    <select name="category_id" class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition max-w-[160px]">
                        <option value="">All Categories</option>
                        @foreach($categories as $cat)
                            <option value="{{ $cat->id }}" {{ (string)$categoryId === (string)$cat->id ? 'selected' : '' }}>{{ $cat->name }}</option>
                        @endforeach
                    </select>

                    <select name="sub_category_id" class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition max-w-[160px]">
                        <option value="">All Sub-Categories</option>
                        @foreach($subCategories as $sub)
                            <option value="{{ $sub->id }}" {{ (string)$subCategoryId === (string)$sub->id ? 'selected' : '' }}>{{ $sub->name }}</option>
                        @endforeach
                    </select>

                    <select name="status" class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition">
                        <option value="">All Status</option>
                        <option value="1" {{ $status === '1' ? 'selected' : '' }}>Active</option>
                        <option value="0" {{ $status === '0' ? 'selected' : '' }}>Inactive</option>
                    </select>

                    <select name="per_page" class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition">
                        <option value="10" {{ $perPage == 10 ? 'selected' : '' }}>10 / page</option>
                        <option value="25" {{ $perPage == 25 ? 'selected' : '' }}>25 / page</option>
                        <option value="50" {{ $perPage == 50 ? 'selected' : '' }}>50 / page</option>
                    </select>

                    <button type="submit" class="bg-[#0F172A] hover:bg-slate-800 text-white font-medium px-5 py-2 rounded-xl text-sm transition shadow-sm">
                        Filter
                    </button>
                </div>
            </form>
        </div>

        <!-- Table Section matching Image 1 -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr class="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            <th class="px-6 py-4 w-12 text-center">#</th>
                            <th class="px-6 py-4">Thumbnail</th>
                            <th class="px-6 py-4">Product Name</th>
                            <th class="px-6 py-4">Design No.</th>
                            <th class="px-6 py-4">Barcode</th>
                            <th class="px-6 py-4">Category / Sub-Category</th>
                            <th class="px-6 py-4">Sizes & Rates</th>
                            <th class="px-6 py-4 text-center">Original</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-700">
                        @forelse($products as $index => $product)
                            @php
                                $img = $product->primaryImage();
                                $thumbUrl = $img ? asset('storage/' . $img->displayPath()) : null;
                            @endphp
                            <tr class="hover:bg-slate-50/50 transition">
                                <td class="px-6 py-4 text-center font-medium text-slate-400">
                                    {{ $products->firstItem() + $index }}
                                </td>
                                <td class="px-6 py-4">
                                    @if($thumbUrl)
                                        <img src="{{ $thumbUrl }}" alt="{{ $product->name }}" class="w-12 h-14 rounded-xl object-cover border border-slate-200 shadow-sm">
                                    @else
                                        <div class="w-12 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                                            NO IMG
                                        </div>
                                    @endif
                                </td>
                                <td class="px-6 py-4">
                                    <div class="font-bold text-slate-900 text-base">{{ $product->name }}</div>
                                    <div class="text-slate-400 text-xs mt-0.5 capitalize">{{ $product->orientation }} Orientation</div>
                                </td>
                                <td class="px-6 py-4 font-mono font-semibold text-slate-800">
                                    {{ $product->design_number ?: '-' }}
                                </td>
                                <td class="px-6 py-4 font-mono text-xs text-slate-500">
                                    {{ $product->barcode ?: '-' }}
                                </td>
                                <td class="px-6 py-4">
                                    <div class="font-medium text-slate-900">{{ $product->category->name ?? '-' }}</div>
                                    <div class="text-emerald-600 text-xs font-semibold mt-0.5">{{ $product->subCategory->name ?? '-' }}</div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-wrap gap-1 max-w-[200px]">
                                        @forelse($product->sizes as $sz)
                                            <span class="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                                                <span class="font-bold">{{ $sz->size }}:</span> ₹{{ number_format($sz->rate, 0) }}
                                            </span>
                                        @empty
                                            <span class="text-slate-400 text-xs">-</span>
                                        @endforelse
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {{ $product->keep_original ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600' }}">
                                        {{ $product->keep_original ? 'Yes' : 'No' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold {{ $product->status ? 'bg-emerald-100/90 text-emerald-800' : 'bg-rose-100/90 text-rose-800' }}">
                                        <span class="w-1.5 h-1.5 rounded-full {{ $product->status ? 'bg-emerald-600' : 'bg-rose-600' }}"></span>
                                        {{ $product->status ? 'Active' : 'Inactive' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end space-x-2">
                                        <button type="button" @click='openEditModal(@json($product))' class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit Product">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        </button>
                                        <form method="POST" action="{{ route('products.destroy', $product) }}" onsubmit="return confirm('Are you sure you want to delete this product?')" class="inline-block">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Delete Product">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="10" class="px-6 py-12 text-center text-slate-400">
                                    No products found. Click <strong>+ Add New Product</strong> to create one.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @if($products->hasPages())
                <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    {{ $products->links() }}
                </div>
            @endif
        </div>

        <!-- Add/Edit Product Modal Popup -->
        <div x-show="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" x-cloak x-transition>
            <div @click.outside="showModal = false" class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 relative my-8">
                <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 class="text-lg font-bold text-slate-900" x-text="modalTitle"></h3>
                    <button type="button" @click.prevent="showModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form :action="actionUrl" method="POST" enctype="multipart/form-data" class="space-y-4">
                    @csrf
                    <template x-if="editMode">
                        <input type="hidden" name="_method" value="PUT">
                    </template>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Category <span class="text-rose-500">*</span></label>
                            <select name="category_id" x-model="categoryId" required class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                                @foreach($categories as $cat)
                                    <option value="{{ $cat->id }}">{{ $cat->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Sub-Category <span class="text-rose-500">*</span></label>
                            <select name="sub_category_id" x-model="subCategoryId" required class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                                @foreach($subCategories as $sub)
                                    <option value="{{ $sub->id }}">{{ $sub->name }} ({{ $sub->category->name ?? '' }})</option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Name <span class="text-rose-500">*</span></label>
                        <input type="text" name="name" x-model="name" required placeholder="e.g. Traffic Shorts" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Design Number</label>
                            <input type="text" name="design_number" x-model="designNumber" placeholder="e.g. 92093" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Barcode</label>
                            <input type="text" name="barcode" x-model="barcode" placeholder="e.g. 890123456" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Display Order</label>
                            <input type="number" name="display_order" x-model="displayOrder" min="1" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Keep As Original</label>
                            <select name="keep_original" x-model="keepOriginal" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                                <option :value="false">No (Process Background)</option>
                                <option :value="true">Yes (Keep Original Image)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Orientation</label>
                            <select name="orientation" x-model="orientation" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                                <option value="vertical">Vertical</option>
                                <option value="horizontal">Horizontal</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
                            <label class="flex items-center gap-2 cursor-pointer mt-2">
                                <input type="checkbox" name="status" value="1" :checked="status" x-model="status" class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
                                <span class="text-sm font-medium text-slate-700" x-text="status ? 'Active' : 'Inactive'"></span>
                            </label>
                        </div>
                    </div>

                    <!-- Size & Rate Combinations section matching PDF Page 4 -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-xs font-semibold text-slate-700 uppercase">Sizes & Rates</label>
                            <button type="button" @click="addSizeRow()" class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                + Add More Size
                            </button>
                        </div>
                        <div class="space-y-2">
                            <template x-for="(sz, idx) in sizes" :key="idx">
                                <div class="flex items-center gap-2">
                                    <input type="text" :name="'sizes['+idx+'][size]'" x-model="sz.size" placeholder="Size (e.g. M, L, XL)" class="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                                    <input type="number" :name="'sizes['+idx+'][rate]'" x-model="sz.rate" step="0.01" placeholder="Rate (₹)" class="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                                    <button type="button" @click="removeSizeRow(idx)" class="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                                        &times;
                                    </button>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Upload Product Images</label>
                        <input type="file" name="images[]" multiple accept="image/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition">
                    </div>

                    <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                        <button type="button" @click="showModal = false" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold text-sm shadow-sm transition">
                            Save Product
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</x-layouts.app>
