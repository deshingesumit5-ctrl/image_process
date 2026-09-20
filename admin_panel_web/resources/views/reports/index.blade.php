<x-layouts.app title="Reports">
    <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="mb-4 font-semibold">Sharing history</h2>
            <table class="w-full text-left text-sm">
                <thead class="text-slate-500"><tr><th class="py-2">When</th><th>User</th><th>Via</th><th>Products</th></tr></thead>
                <tbody>
                @foreach($shares as $share)
                    <tr class="border-t"><td class="py-2">{{ $share->shared_at }}</td><td>{{ $share->user?->name }}</td><td>{{ $share->shared_via }}</td><td>{{ implode(', ', $share->product_ids ?? []) }}</td></tr>
                @endforeach
                </tbody>
            </table>
            <div class="mt-3">{{ $shares->links() }}</div>
        </div>
        <div class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="mb-4 font-semibold">Processing activity</h2>
            <table class="w-full text-left text-sm">
                <thead class="text-slate-500"><tr><th class="py-2">Day</th><th>User</th><th>Images</th></tr></thead>
                <tbody>
                @foreach($processing as $row)
                    <tr class="border-t"><td class="py-2">{{ $row->day }}</td><td>{{ $row->user_name ?? '—' }}</td><td>{{ $row->total }}</td></tr>
                @endforeach
                </tbody>
            </table>
            <div class="mt-3">{{ $processing->links() }}</div>
        </div>
    </div>
</x-layouts.app>
