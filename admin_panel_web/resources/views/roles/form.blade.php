<x-layouts.app :title="$role->exists ? 'Edit Role' : 'Add Role'">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
            <div class="text-emerald-600 font-medium text-xs tracking-wider uppercase flex items-center gap-1.5 mb-1">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Access Management
            </div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{{ $role->exists ? 'Edit Role' : 'Add New Role' }}</h1>
            <p class="text-slate-500 text-sm mt-1">{{ $role->exists ? 'Update role details and module permissions.' : 'Create a new role and assign module access permissions.' }}</p>
        </div>
        <div>
            <a href="{{ route('roles.index') }}" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Roles
            </a>
        </div>
    </div>

    <form method="POST" action="{{ $role->exists ? route('roles.update', $role) : route('roles.store') }}" class="space-y-6">
        @csrf
        @if($role->exists) @method('PUT') @endif

        <!-- Role Info Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Role Information
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Role Name <span class="text-rose-500">*</span></label>
                    <input name="name" value="{{ old('name', $role->name) }}" placeholder="e.g. Manager, Sales Staff" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" required>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                    <input name="description" value="{{ old('description', $role->description) }}" placeholder="Brief description of this role" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                </div>
            </div>
            <div class="mt-4">
                <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" name="status" value="1" @checked(old('status', $role->status)) class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
                    <span class="text-sm font-medium text-slate-700">Active</span>
                    <span class="text-xs text-slate-400">(Users with this role can login and access assigned modules)</span>
                </label>
            </div>
        </div>

        <!-- Permissions Table Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Module Permissions</h2>
                <span class="text-xs text-slate-400 ml-1">— Assign view/add/edit/delete access per module</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr class="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            <th class="px-6 py-4">Module</th>
                            <th class="px-6 py-4 text-center">View</th>
                            <th class="px-6 py-4 text-center">Add</th>
                            <th class="px-6 py-4 text-center">Edit</th>
                            <th class="px-6 py-4 text-center">Delete</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-700">
                        @foreach($permissions as $permission)
                            @php $row = $matrix[$permission->id] ?? null; @endphp
                            <tr class="hover:bg-slate-50/50 transition">
                                <td class="px-6 py-4">
                                    <div class="font-semibold text-slate-800">{{ $permission->label }}</div>
                                    <div class="text-xs text-slate-400 font-mono">{{ $permission->module_key }}</div>
                                </td>
                                @foreach(['view','add','edit','delete'] as $ability)
                                    <td class="px-6 py-4 text-center">
                                        <input type="checkbox"
                                            name="access[{{ $permission->id }}][{{ $ability }}]"
                                            @checked($row?->{'can_'.$ability})
                                            class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer">
                                    </td>
                                @endforeach
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Save Button -->
        <div class="flex items-center justify-end gap-3">
            <a href="{{ route('roles.index') }}" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">
                Cancel
            </a>
            <button type="submit" class="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold text-sm shadow-sm transition">
                Save Role
            </button>
        </div>
    </form>
</x-layouts.app>
