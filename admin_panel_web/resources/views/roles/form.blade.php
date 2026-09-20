<x-layouts.app :title="$role->exists ? 'Edit Role' : 'Add Role'">
    <form method="POST" action="{{ $role->exists ? route('roles.update', $role) : route('roles.store') }}" class="space-y-6">
        @csrf
        @if($role->exists) @method('PUT') @endif
        <div class="max-w-lg space-y-3 rounded-2xl bg-white p-6 shadow-sm">
            <input name="name" value="{{ old('name', $role->name) }}" placeholder="Role name" class="w-full rounded-lg border px-3 py-2" required>
            <input name="description" value="{{ old('description', $role->description) }}" placeholder="Description" class="w-full rounded-lg border px-3 py-2">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="status" value="1" @checked(old('status', $role->status))> Active</label>
        </div>
        <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table class="w-full text-left text-sm">
                <thead class="bg-slate-50"><tr><th class="px-4 py-3">Module</th><th>View</th><th>Add</th><th>Edit</th><th>Delete</th></tr></thead>
                <tbody>
                @foreach($permissions as $permission)
                    @php $row = $matrix[$permission->id] ?? null; @endphp
                    <tr class="border-t">
                        <td class="px-4 py-3">{{ $permission->label }}</td>
                        @foreach(['view','add','edit','delete'] as $ability)
                            <td><input type="checkbox" name="access[{{ $permission->id }}][{{ $ability }}]" @checked($row?->{'can_'.$ability})></td>
                        @endforeach
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save Role</button>
    </form>
</x-layouts.app>
