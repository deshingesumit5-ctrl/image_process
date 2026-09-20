<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function shortlists(): HasMany
    {
        return $this->hasMany(Shortlist::class);
    }

    public function canModule(string $moduleKey, string $ability = 'view'): bool
    {
        if (! $this->status || ! $this->role || ! $this->role->status) {
            return false;
        }

        $column = match ($ability) {
            'add' => 'can_add',
            'edit' => 'can_edit',
            'delete' => 'can_delete',
            default => 'can_view',
        };

        $permission = Permission::query()->where('module_key', $moduleKey)->first();
        if (! $permission) {
            return false;
        }

        $row = RolePermission::query()
            ->where('role_id', $this->role_id)
            ->where('permission_id', $permission->id)
            ->first();

        return (bool) ($row?->{$column});
    }

    public function permissionMap(): array
    {
        $rows = RolePermission::query()
            ->with('permission')
            ->where('role_id', $this->role_id)
            ->get();

        $map = [];
        foreach ($rows as $row) {
            if (! $row->permission) {
                continue;
            }
            $map[$row->permission->module_key] = [
                'label' => $row->permission->label,
                'view' => $row->can_view,
                'add' => $row->can_add,
                'edit' => $row->can_edit,
                'delete' => $row->can_delete,
            ];
        }

        return $map;
    }
}
