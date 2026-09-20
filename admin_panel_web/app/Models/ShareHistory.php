<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShareHistory extends Model
{
    public $timestamps = false;

    protected $table = 'share_history';

    protected $fillable = ['user_id', 'product_ids', 'shared_via', 'shared_at'];

    protected function casts(): array
    {
        return [
            'product_ids' => 'array',
            'shared_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
