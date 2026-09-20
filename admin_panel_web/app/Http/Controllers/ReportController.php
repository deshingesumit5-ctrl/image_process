<?php

namespace App\Http\Controllers;

use App\Models\ProcessingLog;
use App\Models\ShareHistory;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $shares = ShareHistory::query()
            ->with('user')
            ->latest('shared_at')
            ->paginate(20, ['*'], 'shares_page');

        $processing = ProcessingLog::query()
            ->from('processing_logs as p')
            ->leftJoin('users', 'users.id', '=', 'p.user_id')
            ->selectRaw('DATE(p.processed_at) as day, users.name as user_name, SUM(p.image_count) as total')
            ->groupByRaw('DATE(p.processed_at), users.name')
            ->orderByDesc('day')
            ->paginate(20, ['*'], 'process_page');

        return view('reports.index', compact('shares', 'processing'));
    }
}
