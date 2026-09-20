<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'product_id', 'original_path', 'processed_path', 'is_processed', 'background_id',
    ];

    protected function casts(): array
    {
        return ['is_processed' => 'boolean'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function background(): BelongsTo
    {
        return $this->belongsTo(Background::class);
    }

    public function displayPath(): string
    {
        return $this->processed_path ?: $this->original_path;
    }
}
