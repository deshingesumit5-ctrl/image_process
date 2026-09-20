<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\RolePermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::query()->withCount('users')->latest('id')->paginate(15);

        return view('roles.index', compact('roles'));
    }

    public function create()
    {
        return view('roles.form', [
            'role' => new Role(['status' => true]),
            'permissions' => Permission::query()->orderBy('id')->get(),
            'matrix' => [],
        ]);
    }

    public function store(Request $request)
    {
        $this->persist($request, new Role);

        return redirect()->route('roles.index')->with('success', 'Role created.');
    }

    public function edit(Role $role)
    {
        $matrix = $role->rolePermissions()->get()->keyBy('permission_id');

        return view('roles.form', [
            'role' => $role,
            'permissions' => Permission::query()->orderBy('id')->get(),
            'matrix' => $matrix,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $this->persist($request, $role);

        return redirect()->route('roles.index')->with('success', 'Role updated.');
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return redirect()->route('roles.index')->with('success', 'Role deleted.');
    }

    private function persist(Request $request, Role $role): void
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'boolean'],
            'access' => ['nullable', 'array'],
        ]);

        DB::transaction(function () use ($data, $request, $role) {
            $role->fill([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'status' => $request->boolean('status'),
            ])->save();

            foreach (Permission::all() as $permission) {
                $access = $request->input("access.{$permission->id}", []);
                RolePermission::query()->updateOrCreate(
                    ['role_id' => $role->id, 'permission_id' => $permission->id],
                    [
                        'can_view' => isset($access['view']),
                        'can_add' => isset($access['add']),
                        'can_edit' => isset($access['edit']),
                        'can_delete' => isset($access['delete']),
                    ]
                );
            }
        });
    }
}
