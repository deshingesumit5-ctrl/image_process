<x-layouts.app title="Backgrounds - Admin Panel Web">
    <div x-data="{ 
        showModal: false, 
        editMode: false,
        modalTitle: 'Add New Background',
        actionUrl: '{{ route('backgrounds.store') }}',
        bgId: null,
        name: '',
        categoryType: '',
        orientation: 'vertical',
        status: true,
        previewUrl: null,

        openCreateModal() {
            this.editMode = false;
            this.modalTitle = 'Add New Background';
            this.actionUrl = '{{ route('backgrounds.store') }}';
            this.bgId = null;
            this.name = '';
            this.categoryType = '';
            this.orientation = 'vertical';
            this.status = true;
            this.previewUrl = null;
            this.showModal = true;
        },

        openEditModal(bg) {
            this.editMode = true;
            this.modalTitle = 'Edit Background';
            this.actionUrl = '{{ url('backgrounds') }}/' + bg.id;
            this.bgId = bg.id;
            this.name = bg.name;
            this.categoryType = bg.category_type || '';
            this.orientation = bg.orientation || 'vertical';
            this.status = Boolean(bg.status);
            this.previewUrl = bg.image_path ? '{{ asset('storage') }}/' + bg.image_path : null;
            this.showModal = true;
        }
    }">

        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
                <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Background Master</h1>
                <p class="text-slate-500 text-sm mt-1">Manage catalog backgrounds, orientation and dimensions.</p>
            </div>
            <div>
                <button @click="openCreateModal()" class="bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                     Add New Background
                </button>
            </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
            <form method="GET" action="{{ route('backgrounds.index') }}" class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="relative flex-1 w-full max-w-xl">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" name="q" value="{{ $q }}" placeholder="Search background name..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                </div>

                <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <select name="orientation" class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition">
                        <option value="">All Orientations</option>
                        <option value="vertical" {{ $orientation === 'vertical' ? 'selected' : '' }}>Vertical</option>
                        <option value="horizontal" {{ $orientation === 'horizontal' ? 'selected' : '' }}>Horizontal</option>
                    </select>

                    <select name="status" class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 transition">
                        <option value="">All Status</option>
                        <option value="1" {{ ($status ?? '') === '1' ? 'selected' : '' }}>Active</option>
                        <option value="0" {{ ($status ?? '') === '0' ? 'selected' : '' }}>Inactive</option>
                    </select>

                    <button type="submit" class="bg-[#0F172A] hover:bg-slate-800 text-white font-medium px-5 py-2 rounded-xl text-sm transition shadow-sm">
                        Filter
                    </button>
                </div>
            </form>
        </div>

        <!-- Table Section -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr class="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            <th class="px-6 py-4 w-12 text-center">#</th>
                            <th class="px-6 py-4">Thumbnail</th>
                            <th class="px-6 py-4">Background Name</th>
                            <th class="px-6 py-4">Category Type</th>
                            <th class="px-6 py-4 text-center">Orientation</th>
                            <th class="px-6 py-4 text-center">Dimensions</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-700">
                        @forelse($backgrounds as $index => $bg)
                            <tr class="hover:bg-slate-50/50 transition">
                                <td class="px-6 py-4 text-center font-medium text-slate-400">
                                    {{ $backgrounds->firstItem() + $index }}
                                </td>
                                <td class="px-6 py-4">
                                    @if($bg->image_path)
                                        <img src="{{ asset('storage/'.$bg->image_path) }}" alt="{{ $bg->name }}" class="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm">
                                    @else
                                        <div class="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm">
                                            {{ strtoupper(substr($bg->name, 0, 2)) }}
                                        </div>
                                    @endif
                                </td>
                                <td class="px-6 py-4">
                                    <div class="font-bold text-slate-900 text-base">{{ $bg->name }}</div>
                                </td>
                                <td class="px-6 py-4 text-slate-600">
                                    {{ $bg->category_type }}
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span class="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 font-semibold text-slate-700 text-xs capitalize">
                                        {{ $bg->orientation }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-center text-slate-500 font-mono text-xs">
                                    {{ $bg->width }}×{{ $bg->height }}
                                </td>
                                <td class="px-6 py-4">
                                    <form method="POST" action="{{ route('backgrounds.toggle', $bg) }}" class="inline-block">
                                        @csrf
                                        <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer {{ $bg->status ? 'bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100/90 text-rose-800 hover:bg-rose-200' }}">
                                            <span class="w-1.5 h-1.5 rounded-full {{ $bg->status ? 'bg-emerald-600' : 'bg-rose-600' }}"></span>
                                            {{ $bg->status ? 'Active' : 'Inactive' }}
                                        </button>
                                    </form>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end space-x-2">
                                        <button @click='openEditModal(@json($bg))' class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit Background">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                        </button>
                                        <form method="POST" action="{{ route('backgrounds.destroy', $bg) }}" onsubmit="return confirm('Are you sure you want to delete this background?')" class="inline-block">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Delete Background">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                                    No backgrounds found. Click <strong>+ Add New Background</strong> to create one.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @if($backgrounds->hasPages())
                <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    {{ $backgrounds->links() }}
                </div>
            @endif
        </div>

        <!-- Add/Edit Background Modal Popup -->
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
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Background Name <span class="text-rose-500">*</span></label>
                        <input type="text" name="name" x-model="name" required placeholder="e.g. Studio Horizontal" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Category Type</label>
                        <input type="text" name="category_type" x-model="categoryType" placeholder="e.g. Studio, Wall, White" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Orientation</label>
                            <select name="orientation" x-model="orientation" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
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

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Background Image</label>
                        <input type="file" name="image" accept="image/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition">
                        <p class="text-[11px] text-slate-400 mt-1">Width/height are read automatically from the uploaded image.</p>
                        <template x-if="previewUrl">
                            <div class="mt-2 flex items-center gap-3">
                                <img :src="previewUrl" class="w-12 h-12 rounded-xl object-cover border border-slate-200">
                                <span class="text-xs text-slate-400">Current Image</span>
                            </div>
                        </template>
                    </div>

                    <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                        <button type="button" @click="showModal = false" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button type="submit" class="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold text-sm shadow-sm transition">
                            Save Background
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</x-layouts.app>