<x-layouts.app :title="$user->exists ? 'Edit User' : 'Add User'">
    <form method="POST" action="{{ $user->exists ? route('users.update', $user) : route('users.store') }}" class="max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        @csrf
        @if($user->exists) @method('PUT') @endif
        <input name="name" value="{{ old('name', $user->name) }}" placeholder="Name" class="w-full rounded-lg border px-3 py-2" required>
        <input name="email" type="email" value="{{ old('email', $user->email) }}" placeholder="Email" class="w-full rounded-lg border px-3 py-2" required>
        <select name="role_id" class="w-full rounded-lg border px-3 py-2" required>
            @foreach($roles as $role)
                <option value="{{ $role->id }}" @selected(old('role_id', $user->role_id)==$role->id)>{{ $role->name }}</option>
            @endforeach
        </select>
        <input name="password" type="password" placeholder="{{ $user->exists ? 'Leave blank to keep password' : 'Password' }}" class="w-full rounded-lg border px-3 py-2" @if(!$user->exists) required @endif>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="status" value="1" @checked(old('status', $user->status))> Active</label>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save</button>
    </form>
</x-layouts.app>
