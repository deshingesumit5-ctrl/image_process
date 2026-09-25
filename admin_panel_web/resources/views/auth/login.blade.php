<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Login · Image Process</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex min-h-screen items-center justify-center bg-[#0b0f1a]">
<div class="w-full max-w-md rounded-2xl bg-[#111726] p-8 shadow-2xl border border-white/5">

    <!-- Icon circle -->
    <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/40">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
        </svg>
    </div>

    <h1 class="mb-1 text-center text-2xl font-semibold text-white">Image Process Admin Panel</h1>
    <p class="mb-8 text-center text-sm text-slate-400">Sign in with your credentials</p>

    @if($errors->any())
        <p class="mb-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{{ $errors->first() }}</p>
    @endif

    <form method="POST" action="{{ route('login') }}" class="space-y-5">
        @csrf
        <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-200">Email Address</label>
            <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="m22 6-10 7L2 6"/>
                    </svg>
                </span>
                <input name="email" type="email" value="{{ old('email') }}" placeholder="Enter email"
                    class="w-full rounded-lg border border-white/10 bg-[#0b0f1a] py-2.5 pl-10 pr-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required>
            </div>
        </div>

        <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-200">Password</label>
            <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                </span>
                <input id="password" name="password" type="password" placeholder="Enter password"
                    class="w-full rounded-lg border border-white/10 bg-[#0b0f1a] py-2.5 pl-10 pr-10 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required>
                <button type="button" id="togglePassword" class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300">
                    <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </div>
            <div class="mt-2 text-right">
                                              <button type="button" id="forgotPasswordLink" class="text-sm font-medium text-emerald-400 hover:underline">Forgot Password?</button>
            </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" name="remember" class="rounded border-white/20 bg-[#0b0f1a] text-blue-600 focus:ring-0"> Remember me
        </label>

              <button class="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 font-semibold uppercase tracking-wide text-white hover:bg-emerald-500 transition">
            Login
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
        </button>
    </form>
</div>

<!-- Forgot Password Modal -->
<div id="forgotPasswordModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60">
    <div class="w-full max-w-md rounded-2xl bg-[#111726] p-6 shadow-2xl border border-white/5">
        <div class="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
            <h2 class="flex items-center gap-2 text-lg font-semibold text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="8" cy="15" r="4"/><path d="m10.5 12.5 7-7L21 8l-2.5 2.5M16 6l2 2"/>
                </svg>
                Forgot / Reset Password
            </h2>
            <button type="button" id="closeModalX" class="text-slate-400 hover:text-white">&times;</button>
        </div>

        <div class="space-y-4">
            <div>
                <label class="mb-1.5 block text-sm text-slate-200">Admin Email Address <span class="text-rose-400">*</span></label>
                <input id="resetEmail" type="email" placeholder="admin@gmail.com"
                    class="w-full rounded-lg border border-white/10 bg-[#0b0f1a] px-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none">
            </div>
            <div>
                <label class="mb-1.5 block text-sm text-slate-200">Enter New Password <span class="text-rose-400">*</span></label>
                <div class="relative">
                    <input id="newPassword" type="password" placeholder="Enter new password"
                        class="w-full rounded-lg border border-white/10 bg-[#0b0f1a] px-3 py-2.5 pr-10 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none">
                    <button type="button" class="toggleModalPassword absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300" data-target="newPassword">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
            </div>
            <div>
                <label class="mb-1.5 block text-sm text-slate-200">Confirm New Password <span class="text-rose-400">*</span></label>
                <div class="relative">
                    <input id="confirmPassword" type="password" placeholder="Repeat new password"
                        class="w-full rounded-lg border border-white/10 bg-[#0b0f1a] px-3 py-2.5 pr-10 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none">
                    <button type="button" class="toggleModalPassword absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300" data-target="confirmPassword">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
            </div>
            <p id="resetError" class="hidden text-sm text-rose-400"></p>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" id="cancelReset" class="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                <button type="button" id="saveReset" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Save & Update Password</button>
            </div>
        </div>
    </div>
</div>

<script>
    // Toggle main password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    togglePassword.addEventListener('click', () => {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });

    // Toggle modal password fields
    document.querySelectorAll('.toggleModalPassword').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            input.type = input.type === 'password' ? 'text' : 'password';
        });
    });

    // Modal open/close
    const modal = document.getElementById('forgotPasswordModal');
    const forgotLink = document.getElementById('forgotPasswordLink');
    const cancelReset = document.getElementById('cancelReset');
    const closeModalX = document.getElementById('closeModalX');
    const saveReset = document.getElementById('saveReset');
    const resetEmail = document.getElementById('resetEmail');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const resetError = document.getElementById('resetError');

    forgotLink.addEventListener('click', () => {
        resetEmail.value = document.querySelector('input[name="email"]').value || '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        resetError.classList.add('hidden');
    }
    cancelReset.addEventListener('click', closeModal);
    closeModalX.addEventListener('click', closeModal);

    saveReset.addEventListener('click', async () => {
        const email = resetEmail.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!email || !newPassword || !confirmPassword) {
            resetError.textContent = 'All fields are required.';
            resetError.classList.remove('hidden');
            return;
        }
        if (newPassword !== confirmPassword) {
            resetError.textContent = 'Passwords do not match.';
            resetError.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch("{{ route('password.reset.update') }}", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    email: email,
                    password: newPassword,
                    password_confirmation: confirmPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                resetError.textContent = data.message || 'Could not reset password.';
                resetError.classList.remove('hidden');
                return;
            }

            document.querySelector('input[name="email"]').value = email;
            passwordInput.value = newPassword;
            closeModal();
            document.querySelector('form').submit();
        } catch (err) {
            resetError.textContent = 'Something went wrong. Please try again.';
            resetError.classList.remove('hidden');
        }
    });
</script>
</body>
</html>