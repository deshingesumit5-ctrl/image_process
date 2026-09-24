<x-layouts.app title="Share Product Template - Admin Panel Web">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
    
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Share Product Template</h1>
            <p class="text-slate-500 text-sm mt-1">Customize the WhatsApp message template used when sharing products with customers.</p>
        </div>
    </div>

    <div class="max-w-3xl">
        <form method="POST" action="{{ route('share-template.update') }}" class="space-y-6">
            @csrf @method('PUT')

            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                    Template Configuration
                </h2>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Template Name</label>
                    <input name="name" value="{{ $template->name }}" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Message Body <span class="text-rose-500">*</span></label>
                    <textarea name="template_body" rows="14" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition leading-relaxed">{{ $template->template_body }}</textarea>
                </div>

                <!-- Available Placeholders -->
                <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-4">
                    <p class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Available Placeholders</p>
                    <div class="flex flex-wrap gap-2">
                        @foreach(['{design_number}', '{product_name}', '{sizes}', '{rate}', '{business_contact}', '{business_name}'] as $placeholder)
                            <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-indigo-700 font-semibold shadow-sm">
                                {{ $placeholder }}
                            </span>
                        @endforeach
                    </div>
                    <p class="text-xs text-slate-400 mt-2">Use these placeholders in your message body — they will be replaced with actual product data when sharing.</p>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3">
                <button type="submit" class="px-6 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#00915c] text-white font-semibold text-sm shadow-sm transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    Save Template
                </button>
            </div>
        </form>
    </div>
</x-layouts.app>
