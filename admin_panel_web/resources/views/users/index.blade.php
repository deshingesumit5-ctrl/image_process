<x-layouts.app title="Users">
    <div class="mb-4 flex items-center justify-between">
        <form class="flex gap-2"><input name="q" value="{{ $q }}" class="rounded-lg border px-3 py-2"><button class="rounded-lg bg-slate-800 px-4 py-2 text-white">Search</button></form>
        <a href="{{ route('users.create') }}" class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Add User</a>
    </div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50"><tr><th class="px-4 py-3">Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
            @foreach($users as $user)
                <tr class="border-t">
                    <td class="px-4 py-3">{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>{{ $user->role?->name }}</td>
                    <td>{{ $user->status ? 'Active' : 'Inactive' }}</td>
                    <td class="px-4 py-3 text-right space-x-2">
                        <a class="text-indigo-600" href="{{ route('users.edit', $user) }}">Edit</a>
                        <form class="inline" method="POST" action="{{ route('users.destroy', $user) }}" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="text-rose-600">Delete</button></form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
        <div class="p-4">{{ $users->links() }}</div>
    </div>
</x-layouts.app>
