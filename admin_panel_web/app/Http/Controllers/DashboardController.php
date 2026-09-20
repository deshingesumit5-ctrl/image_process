<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProcessingLog;
use App\Models\ShareHistory;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        return view('dashboard', [
            'productCount' => Product::query()->count(),
            'shareCount' => ShareHistory::query()->count(),
            'processedToday' => ProcessingLog::query()->whereDate('processed_at', today())->sum('image_count'),
        ]);
    }
}
