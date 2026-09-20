<x-layouts.app title="Roles & Access">
    <div class="mb-4 text-right"><a href="{{ route('roles.create') }}" class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Add Role</a></div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50"><tr><th class="px-4 py-3">Role</th><th>Users</th><th>Status</th><th></th></tr></thead>
            <tbody>
            @foreach($roles as $role)
                <tr class="border-t">
                    <td class="px-4 py-3">{{ $role->name }}<div class="text-xs text-slate-400">{{ $role->description }}</div></td>
                    <td>{{ $role->users_count }}</td>
                    <td>{{ $role->status ? 'Active' : 'Inactive' }}</td>
                    <td class="px-4 py-3 text-right space-x-2">
                        <a class="text-indigo-600" href="{{ route('roles.edit', $role) }}">Edit</a>
                        <form class="inline" method="POST" action="{{ route('roles.destroy', $role) }}" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="text-rose-600">Delete</button></form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
        <div class="p-4">{{ $roles->links() }}</div>
    </div>
</x-layouts.app>
