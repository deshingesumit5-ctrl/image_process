<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Background extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'name', 'category_type', 'image_path', 'orientation', 'width', 'height', 'status',
    ];

    protected function casts(): array
    {
        return ['status' => 'boolean'];
    }

    public function productImages(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }
}
