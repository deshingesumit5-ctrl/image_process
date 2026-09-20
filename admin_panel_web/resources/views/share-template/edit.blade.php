<x-layouts.app title="WhatsApp Share Template">
    <form method="POST" action="{{ route('share-template.update') }}" class="max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        @csrf @method('PUT')
        <input name="name" value="{{ $template->name }}" class="w-full rounded-lg border px-3 py-2">
        <textarea name="template_body" rows="12" class="w-full rounded-lg border px-3 py-2 font-mono text-sm">{{ $template->template_body }}</textarea>
        <p class="text-xs text-slate-500">Placeholders: {design_number} {product_name} {sizes} {rate} {business_contact} {business_name}</p>
        <button class="rounded-lg bg-indigo-600 px-4 py-2 text-white">Save Template</button>
    </form>
</x-layouts.app>
