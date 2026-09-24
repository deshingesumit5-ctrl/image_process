<x-layouts.app title="Sub-Category Master - Admin Panel Web">
    <div x-data="{ 
        showModal: false, 
        editMode: false,
        modalTitle: 'Add New Sub-Category',
        actionUrl: '{{ route('sub-categories.store') }}',
        subId: null,
        categoryId: '{{ $categories->first()->id ?? '' }}',
        name: '',
        displayOrder: 1,
        status: true,
        previewUrl: null,

        openCreateModal() {
            this.editMode = false;
            this.modalTitle = 'Add New Sub-Category';
            this.actionUrl = '{{ route('sub-categories.store') }}';
            this.subId = null;
            this.name = '';
            this.displayOrder = 1;
            this.status = true;
            this.previewUrl = null;
            this.showModal = true;
        },

        openEditModal(sub) {
            this.editMode = true;
            this.modalTitle = 'Edit Sub-Category';
            this.actionUrl = '{{ url('sub-categories') }}/' + sub.id;
            this.subId = sub.id;
            this.categoryId = sub.category_id;
            this.name = sub.name;
            this.displayOrder = sub.display_order || 1;
            this.status = Boolean(sub.status);
            this.previewUrl = sub.thumbnail_url || null;
            this.showModal = true;
        }
    }">

        <!-- Header Section matching Image 1 -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
               
                <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Sub-Category Master</h1>
                <p class="text-slate-500 text-sm mt-1">Manage product sub-categories, parent category mapping and status.</p>
            </div>
            <div>
                <button @click="openCreateModal()" class="bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Add New Sub-Category
                </button>
            </div>
        </div>

        <!-- Filter & Search Bar matching Image 1 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
            <form method="GET" action="{{ route('sub-categories.index') }}" class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="relative flex-1 w-full max-w-xl">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" name="q" value="{{ $q }}" placeholder="Search sub-category name..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                </div>

                <div class="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                    <select name="category_id" class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition max-w-[200px]">
                        <option value="">All Categories</option>
                        @foreach($categories as $cat)
                            <option value="{{ $cat->id }}" {{ (string)$categoryId === (string)$cat->id ? 'selected' : '' }}>{{ $cat->name }}</option>
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
                            <th class="px-6 py-4">Sub-Category Name</th>
                            <th class="px-6 py-4">Parent Category</th>
                            <th class="px-6 py-4 text-center">Display Order</th>
                            <th class="px-6 py-4">Total Products</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-700">
                        @forelse($subCategories as $index => $sub)
                            <tr class="hover:bg-slate-50/50 transition">
                                <td class="px-6 py-4 text-center font-medium text-slate-400">
                                    {{ $subCategories->firstItem() + $index }}
                                </td>
                                <td class="px-6 py-4">
                                    @if($sub->thumbnail_url)
                                        <img src="{{ $sub->thumbnail_url }}" alt="{{ $sub->name }}" class="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm">
                                    @else
                                        <div class="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm">
                                            {{ strtoupper(substr($sub->name, 0, 2)) }}
                                        </div>
                                    @endif
                                </td>
                                <td class="px-6 py-4">
                                    <div class="font-bold text-slate-900 text-base">{{ $sub->name }}</div>
                                    <div class="text-slate-400 text-xs font-mono mt-0.5">{{ $sub->slug }}</div>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center gap-1.5 font-semibold text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                                        {{ $sub->category->name ?? 'Unmapped' }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-semibold text-slate-700">
                                        {{ $sub->display_order ?? 1 }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 font-medium text-slate-800">
                                    <a href="{{ route('products.index', ['sub_category_id' => $sub->id]) }}" class="hover:text-emerald-600 transition">
                                        {{ $sub->products_count ?? $sub->products()->count() }} Products
                                    </a>
                                </td>
                                <td class="px-6 py-4">
                                    <form method="POST" action="{{ route('sub-categories.toggle', $sub) }}" class="inline-block">
                                        @csrf
                                        <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer {{ $sub->status ? 'bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100/90 text-rose-800 hover:bg-rose-200' }}">
                                            <span class="w-1.5 h-1.5 rounded-full {{ $sub->status ? 'bg-emerald-600' : 'bg-rose-600' }}"></span>
                                            {{ $sub->status ? 'Active' : 'Inactive' }}
                                        </button>
                                    </form>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end space-x-2">
                                        <button @click='openEditModal(@json($sub))' class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit Sub-Category">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        </button>
                                        <form method="POST" action="{{ route('sub-categories.destroy', $sub) }}" onsubmit="return confirm('Are you sure you want to delete this sub-category?')" class="inline-block">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Delete Sub-Category">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                                    No sub-categories found. Click <strong>+ Add New Sub-Category</strong> to create one.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @if($subCategories->hasPages())
                <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    {{ $subCategories->links() }}
                </div>
            @endif
        </div>

        <!-- Add/Edit Sub-Category Modal Popup -->
        <div x-show="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" x-cloak x-transition>
            <div @click.outside="showModal = false" class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 relative">
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

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Parent Category <span class="text-rose-500">*</span></label>
                        <select name="category_id" x-model="categoryId" required class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                            @foreach($categories as $cat)
                                <option value="{{ $cat->id }}">{{ $cat->name }}</option>
                            @endforeach
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Sub-Category Name <span class="text-rose-500">*</span></label>
                        <input type="text" name="name" x-model="name" required placeholder="e.g. Traffic / Casual / Premium" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Display Order</label>
                            <input type="number" name="display_order" x-model="displayOrder" min="1" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
                            <label class="flex items-center gap-2 cursor-pointer mt-2">
                                <input type="checkbox" name="status" value="1" :checked="status" x-model="status" class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
                                <span class="text-sm font-medium text-slate-700" x-text="status ? 'Active' : 'Inactive'"></span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Sub-Category Thumbnail</label>
                        <input type="file" name="image" accept="image/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition">
                        <template x-if="previewUrl">
                            <div class="mt-2 flex items-center gap-3">
                                <img :src="previewUrl" class="w-12 h-12 rounded-xl object-cover border border-slate-200">
                                <span class="text-xs text-slate-400">Current Thumbnail</span>
                            </div>
                        </template>
                    </div>

                    <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                        <button type="button" @click="showModal = false" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold text-sm shadow-sm transition">
                            Save Sub-Category
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</x-layouts.app>
