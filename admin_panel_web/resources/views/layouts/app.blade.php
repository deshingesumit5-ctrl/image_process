<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Admin Panel Web' }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        navy: {
                            800: '#0b132b',
                            900: '#070d1e',
                        },
                        emerald: {
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                        }
                    }
                }
            }
        }
    </script>
    <style>[x-cloak] { display: none !important; }</style>
    @if(file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
</head>
<body class="min-h-screen bg-[#F3F4F6] text-slate-800 flex flex-col font-sans">

    <!-- Navbar Header -->
    <header class="bg-[#0B132B] text-white shadow-md z-40 sticky top-0">
        <div class="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
            <!-- Left Logo -->
            <div class="flex items-center space-x-8">
                <a href="{{ route('dashboard') }}" class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span class="text-white">Admin Panel Web</span>
                </a>

                <!-- Navigation Links -->
                <nav class="hidden lg:flex items-center space-x-1 text-sm font-medium">
                    <a href="{{ route('dashboard') }}" class="px-3.5 py-1.5 rounded-lg hover:bg-white/10 transition {{ request()->routeIs('dashboard') ? 'bg-white/10 text-white font-semibold' : 'text-slate-300' }}">
                        Dashboard
                    </a>

                    <!-- Business Masters Dropdown -->
                    <div class="relative" x-data="{ open: false }" @mouseenter="open = true" @mouseleave="open = false">
                        <button @click="open = !open" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition text-sm font-medium {{ request()->routeIs('categories.*', 'sub-categories.*', 'products.*', 'backgrounds.*') ? 'bg-[#0F4C3A] text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-white/10' }}">
                            <span>Business Masters</span>
                            <svg class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>

                        <div x-show="open" x-cloak x-transition:enter="transition ease-out duration-150" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100" class="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 text-slate-700 z-50 space-y-1">
                            <!-- 1. Category Master -->
                            @if(!empty($menuPermissions['category']['view'] ?? true))
                                <a href="{{ route('categories.index') }}" class="flex items-center gap-3 p-2.5 rounded-xl transition group {{ request()->routeIs('categories.*') ? 'bg-emerald-50/90' : 'hover:bg-slate-50' }}">
                                    <div class="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 {{ request()->routeIs('categories.*') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' }}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-semibold {{ request()->routeIs('categories.*') ? 'text-emerald-700' : 'text-slate-800 group-hover:text-emerald-700' }}">Category Master</div>
                                        <div class="text-xs {{ request()->routeIs('categories.*') ? 'text-emerald-600/80 font-medium' : 'text-slate-400' }}">Root catalog groups</div>
                                    </div>
                                </a>
                            @endif

                            <!-- 2. Sub-Category Master -->
                            @if(!empty($menuPermissions['sub_category']['view'] ?? true))
                                <a href="{{ route('sub-categories.index') }}" class="flex items-center gap-3 p-2.5 rounded-xl transition group {{ request()->routeIs('sub-categories.*') ? 'bg-emerald-50/90' : 'hover:bg-slate-50' }}">
                                    <div class="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 {{ request()->routeIs('sub-categories.*') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' }}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-semibold {{ request()->routeIs('sub-categories.*') ? 'text-emerald-700' : 'text-slate-800 group-hover:text-emerald-700' }}">Sub-Category Master</div>
                                        <div class="text-xs {{ request()->routeIs('sub-categories.*') ? 'text-emerald-600/80 font-medium' : 'text-slate-400' }}">Child segments</div>
                                    </div>
                                </a>
                            @endif

                            <!-- 3. Product Master -->
                            @if(!empty($menuPermissions['product']['view'] ?? true))
                                <a href="{{ route('products.index') }}" class="flex items-center gap-3 p-2.5 rounded-xl transition group {{ request()->routeIs('products.*') ? 'bg-emerald-50/90' : 'hover:bg-slate-50' }}">
                                    <div class="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 {{ request()->routeIs('products.*') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' }}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-semibold {{ request()->routeIs('products.*') ? 'text-emerald-700' : 'text-slate-800 group-hover:text-emerald-700' }}">Product Master</div>
                                        <div class="text-xs {{ request()->routeIs('products.*') ? 'text-emerald-600/80 font-medium' : 'text-slate-400' }}">Items, units & pricing</div>
                                    </div>
                                </a>
                            @endif

                            <!-- 4. Background Master -->
                            @if(!empty($menuPermissions['background']['view'] ?? true))
                                <a href="{{ route('backgrounds.index') }}" class="flex items-center gap-3 p-2.5 rounded-xl transition group {{ request()->routeIs('backgrounds.*') ? 'bg-emerald-50/90' : 'hover:bg-slate-50' }}">
                                    <div class="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 {{ request()->routeIs('backgrounds.*') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600' }}">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                    <div>
                                        <div class="text-sm font-semibold {{ request()->routeIs('backgrounds.*') ? 'text-emerald-700' : 'text-slate-800 group-hover:text-emerald-700' }}">Background Master</div>
                                        <div class="text-xs {{ request()->routeIs('backgrounds.*') ? 'text-emerald-600/80 font-medium' : 'text-slate-400' }}">Studio backgrounds & orientations</div>
                                    </div>
                                </a>
                            @endif
                        </div>
                    </div>

                    <!-- Roles & Access Management -->
                    @if(!empty($menuPermissions['roles']['view'] ?? true))
                        <a href="{{ route('roles.index') }}" class="px-3.5 py-1.5 rounded-lg hover:bg-white/10 transition {{ request()->routeIs('roles.*') ? 'bg-white/10 text-white font-semibold' : 'text-slate-300' }}">
                            Roles & Access
                        </a>
                    @endif

                    <!-- User Master -->
                    @if(!empty($menuPermissions['users']['view'] ?? true))
                        <a href="{{ route('users.index') }}" class="px-3.5 py-1.5 rounded-lg hover:bg-white/10 transition {{ request()->routeIs('users.*') ? 'bg-white/10 text-white font-semibold' : 'text-slate-300' }}">
                            User Master
                        </a>
                    @endif

                    <!-- Share Product -->
                    @if(!empty($menuPermissions['share']['view'] ?? true))
                        <a href="{{ route('share-template.edit') }}" class="px-3.5 py-1.5 rounded-lg hover:bg-white/10 transition {{ request()->routeIs('share-template.*') ? 'bg-white/10 text-white font-semibold' : 'text-slate-300' }}">
                            Share Product
                        </a>
                    @endif

                    <!-- Reports -->
                    @if(!empty($menuPermissions['reports']['view'] ?? true))
                        <a href="{{ route('reports.index') }}" class="px-3.5 py-1.5 rounded-lg hover:bg-white/10 transition {{ request()->routeIs('reports.*') ? 'bg-white/10 text-white font-semibold' : 'text-slate-300' }}">
                            Reports
                        </a>
                    @endif
                </nav>
            </div>

            <!-- Right Navbar User Profile -->
            <div class="flex items-center space-x-4">
                <!-- Profile Dropdown -->
                <div class="relative" x-data="{ open: false }">
                    <button @click="open = !open" class="flex items-center gap-2.5 p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition">
                        <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-semibold text-white border border-emerald-400/30">
                            {{ substr(auth()->user()->name ?? 'A', 0, 1) }}
                        </div>
                        <span class="text-sm font-medium hidden sm:inline-block text-slate-200">{{ auth()->user()->name ?? 'Admin' }}</span>
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div x-show="open" @click.outside="open = false" x-cloak x-transition class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 text-slate-700 z-50">
                        <div class="px-4 py-2.5 border-b border-slate-100">
                            <p class="text-xs text-slate-400">Signed in as</p>
                            <p class="text-sm font-semibold text-slate-800 truncate">{{ auth()->user()->name ?? 'Admin' }}</p>
                            <p class="text-xs text-emerald-600 font-medium mt-0.5">{{ auth()->user()->role->name ?? 'Administrator' }}</p>
                        </div>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition flex items-center gap-2 font-medium">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                Logout
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Body Container -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto p-6 lg:p-8">
        @if(session('success'))
            <div class="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3.5 text-emerald-800 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span class="text-sm font-medium">{{ session('success') }}</span>
                </div>
            </div>
        @endif

        @if($errors->any())
            <div class="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-5 py-3.5 text-rose-800 shadow-sm">
                <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="text-sm font-medium">{{ $errors->first() }}</span>
                </div>
            </div>
        @endif

        {{ $slot }}
    </main>

    <!-- Footer Bar matching Image 1 -->
    <footer class="bg-white border-t border-slate-200 text-xs text-slate-500 py-4 px-6 lg:px-8 mt-auto">
        <div class="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <div>
                <span class="font-semibold text-slate-700">Admin Panel Web</span> © 2026 Image Processing & Catalog Management System
            </div>
            <div class="flex items-center space-x-6">
                <span class="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Production Ready
                </span>
            </div>
        </div>
    </footer>

</body>
</html>
