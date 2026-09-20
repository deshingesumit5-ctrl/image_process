<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q')->toString();
        $users = User::query()
            ->with('role')
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return view('users.index', compact('users', 'q'));
    }

    public function create()
    {
        return view('users.form', [
            'user' => new User(['status' => true]),
            'roles' => Role::query()->where('status', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request, true);
        $data['status'] = $request->boolean('status');
        $data['password'] = $request->string('password')->toString();
        User::query()->create($data);

        return redirect()->route('users.index')->with('success', 'User created.');
    }

    public function edit(User $user)
    {
        return view('users.form', [
            'user' => $user,
            'roles' => Role::query()->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $this->validated($request, false, $user->id);
        $data['status'] = $request->boolean('status');
        if ($request->filled('password')) {
            $data['password'] = $request->string('password')->toString();
        } else {
            unset($data['password']);
        }
        $user->update($data);

        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('users.index')->with('success', 'User deleted.');
    }

    private function validated(Request $request, bool $creating, ?int $id = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($id)],
            'role_id' => ['required', 'exists:roles,id'],
            'status' => ['nullable', 'boolean'],
            'password' => [$creating ? 'required' : 'nullable', 'string', 'min:8'],
        ]);
    }
}
