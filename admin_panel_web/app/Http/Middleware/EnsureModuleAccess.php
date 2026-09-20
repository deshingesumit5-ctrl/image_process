<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleAccess
{
    public function handle(Request $request, Closure $next, string $module, string $ability = 'view'): Response
    {
        $user = $request->user();

        if (! $user || ! $user->canModule($module, $ability)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            abort(403, 'You do not have access to this module.');
        }

        return $next($request);
    }
}
