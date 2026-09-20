<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShortlistItem extends Model
{
    public $timestamps = false;

    protected $fillable = ['shortlist_id', 'product_id', 'product_image_id'];

    public function shortlist(): BelongsTo
    {
        return $this->belongsTo(Shortlist::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productImage(): BelongsTo
    {
        return $this->belongsTo(ProductImage::class);
    }
}
