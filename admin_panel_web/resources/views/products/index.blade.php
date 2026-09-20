<x-layouts.app title="Products">
    <div class="mb-4 flex items-center justify-between">
        <form class="flex gap-2"><input name="q" value="{{ $q }}" class="rounded-lg border px-3 py-2" placeholder="Name, design no, barcode"><button class="rounded-lg bg-slate-800 px-4 py-2 text-white">Search</button></form>
        <a href="{{ route('products.create') }}" class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Add Product</a>
    </div>
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50"><tr><th class="px-4 py-3">Product</th><th>Design</th><th>Category</th><th>Sizes</th><th></th></tr></thead>
            <tbody>
            @foreach($products as $product)
                <tr class="border-t">
                    <td class="px-4 py-3">{{ $product->name }}</td>
                    <td>{{ $product->design_number }}</td>
                    <td>{{ $product->category?->name }} / {{ $product->subCategory?->name }}</td>
                    <td>{{ $product->sizes->map(fn($s) => $s->size.' ₹'.$s->rate)->implode(', ') }}</td>
                    <td class="px-4 py-3 text-right space-x-2">
                        <a class="text-indigo-600" href="{{ route('products.edit', $product) }}">Edit</a>
                        <a class="text-indigo-600" href="{{ route('products.process', $product) }}">Process</a>
                        <form class="inline" method="POST" action="{{ route('products.destroy', $product) }}" onsubmit="return confirm('Delete?')">@csrf @method('DELETE')<button class="text-rose-600">Delete</button></form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
        <div class="p-4">{{ $products->links() }}</div>
    </div>
</x-layouts.app>
