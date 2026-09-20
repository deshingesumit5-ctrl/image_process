@props(['title' => 'Admin'])
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} · Image Process</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = { theme: { extend: { colors: { brand: '#4F46E5' } } } }</script>
</head>
<body class="min-h-screen bg-slate-50">
<header class="bg-indigo-700 text-white">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3">
        <a href="{{ route('dashboard') }}" class="mr-4 text-lg font-semibold">Image Process</a>
        <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('dashboard') ? 'bg-indigo-600' : '' }}" href="{{ route('dashboard') }}">Dashboard</a>
        @if(!empty($menuPermissions['category']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('categories.*') ? 'bg-indigo-600' : '' }}" href="{{ route('categories.index') }}">Categories</a>
        @endif
        @if(!empty($menuPermissions['sub_category']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('sub-categories.*') ? 'bg-indigo-600' : '' }}" href="{{ route('sub-categories.index') }}">Sub-Categories</a>
        @endif
        @if(!empty($menuPermissions['product']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('products.*') ? 'bg-indigo-600' : '' }}" href="{{ route('products.index') }}">Products</a>
        @endif
        @if(!empty($menuPermissions['background']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('backgrounds.*') ? 'bg-indigo-600' : '' }}" href="{{ route('backgrounds.index') }}">Backgrounds</a>
        @endif
        @if(!empty($menuPermissions['roles']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('roles.*') ? 'bg-indigo-600' : '' }}" href="{{ route('roles.index') }}">Roles</a>
        @endif
        @if(!empty($menuPermissions['users']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('users.*') ? 'bg-indigo-600' : '' }}" href="{{ route('users.index') }}">Users</a>
        @endif
        @if(!empty($menuPermissions['share']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('share-template.*') ? 'bg-indigo-600' : '' }}" href="{{ route('share-template.edit') }}">Share Template</a>
        @endif
        @if(!empty($menuPermissions['reports']['view']))
            <a class="rounded-lg px-3 py-2 text-sm hover:bg-indigo-600 {{ request()->routeIs('reports.*') ? 'bg-indigo-600' : '' }}" href="{{ route('reports.index') }}">Reports</a>
        @endif
        <form method="POST" action="{{ route('logout') }}" class="ml-auto">
            @csrf
            <span class="mr-3 text-sm text-indigo-100">{{ auth()->user()->name }}</span>
            <button class="rounded-lg bg-white/10 px-3 py-1.5 text-sm">Logout</button>
        </form>
    </div>
</header>
<main class="mx-auto w-full max-w-7xl p-6">
    <h1 class="mb-5 text-2xl font-semibold text-slate-800">{{ $title }}</h1>
    @if(session('success'))
        <div class="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">{{ session('success') }}</div>
    @endif
    @if($errors->any())
        <div class="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-rose-800">{{ $errors->first() }}</div>
    @endif
    {{ $slot }}
</main>
</body>
</html>
