<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Image Process Admin' }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = { theme: { extend: { colors: { brand: '#4F46E5' } } } }</script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-slate-50">
<div class="flex min-h-screen">
    <aside class="w-64 shrink-0 bg-indigo-700 text-white">
        <div class="px-5 py-6 text-lg font-semibold tracking-wide">Image Process</div>
        <nav class="space-y-1 px-3 pb-8 text-sm">
            <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('dashboard') ? 'bg-indigo-600' : '' }}" href="{{ route('dashboard') }}">Dashboard</a>
            @if(!empty($menuPermissions['category']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('categories.*') ? 'bg-indigo-600' : '' }}" href="{{ route('categories.index') }}">Categories</a>
            @endif
            @if(!empty($menuPermissions['sub_category']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('sub-categories.*') ? 'bg-indigo-600' : '' }}" href="{{ route('sub-categories.index') }}">Sub-Categories</a>
            @endif
            @if(!empty($menuPermissions['product']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('products.*') ? 'bg-indigo-600' : '' }}" href="{{ route('products.index') }}">Products</a>
            @endif
            @if(!empty($menuPermissions['background']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('backgrounds.*') ? 'bg-indigo-600' : '' }}" href="{{ route('backgrounds.index') }}">Backgrounds</a>
            @endif
            @if(!empty($menuPermissions['roles']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('roles.*') ? 'bg-indigo-600' : '' }}" href="{{ route('roles.index') }}">Roles & Access</a>
            @endif
            @if(!empty($menuPermissions['users']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('users.*') ? 'bg-indigo-600' : '' }}" href="{{ route('users.index') }}">Users</a>
            @endif
            @if(!empty($menuPermissions['share']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('share-template.*') ? 'bg-indigo-600' : '' }}" href="{{ route('share-template.edit') }}">Share Template</a>
            @endif
            @if(!empty($menuPermissions['reports']['view']))
                <a class="block rounded-lg px-3 py-2 hover:bg-indigo-600 {{ request()->routeIs('reports.*') ? 'bg-indigo-600' : '' }}" href="{{ route('reports.index') }}">Reports</a>
            @endif
        </nav>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between border-b bg-white px-8 py-4">
            <h1 class="text-xl font-semibold">{{ $title ?? 'Admin' }}</h1>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <span class="mr-4 text-sm text-slate-500">{{ auth()->user()->name }}</span>
                <button class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm">Logout</button>
            </form>
        </header>
        <main class="p-8">
            @if(session('success'))
                <div class="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">{{ session('success') }}</div>
            @endif
            @if($errors->any())
                <div class="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-rose-800">
                    {{ $errors->first() }}
                </div>
            @endif
            {{ $slot }}
        </main>
    </div>
</div>
</body>
</html>
