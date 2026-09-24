<x-layouts.app :title="$user->exists ? 'Edit User' : 'Add User'">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
            <div class="text-emerald-600 font-medium text-xs tracking-wider uppercase flex items-center gap-1.5 mb-1">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                System Users
            </div>
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{{ $user->exists ? 'Edit User' : 'Add New User' }}</h1>
            <p class="text-slate-500 text-sm mt-1">{{ $user->exists ? 'Update user details, role and access status.' : 'Create a new system user and assign a role.' }}</p>
        </div>
        <div>
            <a href="{{ route('users.index') }}" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Users
            </a>
        </div>
    </div>

    <form method="POST" action="{{ $user->exists ? route('users.update', $user) : route('users.store') }}" class="max-w-2xl space-y-4">
        @csrf
        @if($user->exists) @method('PUT') @endif

        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                User Information
            </h2>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name <span class="text-rose-500">*</span></label>
                <input name="name" value="{{ old('name', $user->name) }}" placeholder="e.g. John Doe" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" required>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address <span class="text-rose-500">*</span></label>
                <input name="email" type="email" value="{{ old('email', $user->email) }}" placeholder="e.g. user@example.com" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" required>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Assign Role <span class="text-rose-500">*</span></label>
                <select name="role_id" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" required>
                    <option value="">Select a role...</option>
                    @foreach($roles as $role)
                        <option value="{{ $role->id }}" @selected(old('role_id', $user->role_id)==$role->id)>{{ $role->name }}</option>
                    @endforeach
                </select>
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Password @if($user->exists) <span class="text-slate-400 normal-case font-normal">(leave blank to keep current)</span> @else <span class="text-rose-500">*</span> @endif
                </label>
                <input name="password" type="password" placeholder="{{ $user->exists ? 'Leave blank to keep password' : 'Set a strong password' }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" @if(!$user->exists) required @endif>
            </div>

            <div class="pt-2">
                <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" name="status" value="1" @checked(old('status', $user->status)) class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
                    <span class="text-sm font-medium text-slate-700">Active</span>
                    <span class="text-xs text-slate-400">(User can login and access the system)</span>
                </label>
            </div>
        </div>

        <div class="flex items-center justify-end gap-3">
            <a href="{{ route('users.index') }}" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition">
                Cancel
            </a>
            <button type="submit" class="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold text-sm shadow-sm transition">
                Save User
            </button>
        </div>
    </form>
</x-layouts.app>
