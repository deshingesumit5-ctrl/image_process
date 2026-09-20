<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login · Image Process</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex min-h-screen items-center justify-center bg-indigo-50">
<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
    <h1 class="mb-1 text-2xl font-semibold text-indigo-700">Image Process Admin Panel</h1>
    <p class="mb-6 text-sm text-slate-500">Sign in with your credentials</p>
    @if($errors->any())
        <p class="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{{ $errors->first() }}</p>
    @endif
    <form method="POST" action="{{ route('login') }}" class="space-y-4">
        @csrf
        <div>
            <label class="mb-1 block text-sm">Email</label>
            <input name="email" type="email" value="{{ old('email') }}" class="w-full rounded-lg border px-3 py-2" required>
        </div>
        <div>
            <label class="mb-1 block text-sm">Password</label>
            <input name="password" type="password" class="w-full rounded-lg border px-3 py-2" required>
        </div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="remember"> Remember me</label>
        <button class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white">Login</button>
    </form>
  
</div>
</body>
</html>
