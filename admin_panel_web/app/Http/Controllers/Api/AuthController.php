<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::query()->with('role')->where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password) || ! $user->status) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->payload($user),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('role');

        return response()->json(['user' => $this->payload($user)]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'password' => ['sometimes', 'string', 'min:8'],
            'current_password' => ['required_with:password'],
        ]);

        $user = $request->user();
        if (isset($data['password'])) {
            if (! Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }
            $user->password = $data['password'];
        }
        if (isset($data['name'])) {
            $user->name = $data['name'];
        }
        $user->save();

        return response()->json(['user' => $this->payload($user->fresh('role'))]);
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->name,
            'permissions' => $user->permissionMap(),
        ];
    }
}
