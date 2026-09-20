<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Background;
use Illuminate\Http\Request;

class BackgroundApiController extends Controller
{
    public function index(Request $request)
    {
        $items = Background::query()
            ->where('status', true)
            ->when($request->filled('orientation'), fn ($q) => $q->where('orientation', $request->orientation))
            ->when($request->filled('category_type'), function ($q) use ($request) {
                if ($request->category_type !== 'All') {
                    $q->where('category_type', $request->category_type);
                }
            })
            ->latest('id')
            ->get()
            ->map(fn (Background $bg) => [
                'id' => $bg->id,
                'name' => $bg->name,
                'category_type' => $bg->category_type,
                'orientation' => $bg->orientation,
                'width' => $bg->width,
                'height' => $bg->height,
                'url' => asset('storage/'.$bg->image_path),
            ]);

        return response()->json(['data' => $items]);
    }
}
