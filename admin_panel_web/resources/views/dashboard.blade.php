<x-layouts.app title="Dashboard">
    <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl bg-white p-6 shadow-sm"><p class="text-sm text-slate-500">Products</p><p class="mt-2 text-3xl font-semibold">{{ $productCount }}</p></div>
        <div class="rounded-2xl bg-white p-6 shadow-sm"><p class="text-sm text-slate-500">Shares logged</p><p class="mt-2 text-3xl font-semibold">{{ $shareCount }}</p></div>
        <div class="rounded-2xl bg-white p-6 shadow-sm"><p class="text-sm text-slate-500">Images processed today</p><p class="mt-2 text-3xl font-semibold">{{ $processedToday }}</p></div>
    </div>
</x-layouts.app>
