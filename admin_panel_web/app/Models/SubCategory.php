<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubCategory extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['category_id', 'name', 'image_path', 'display_order', 'status'];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function getSlugAttribute(): string
    {
        return \Illuminate\Support\Str::slug($this->name);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->image_path) {
            return asset('storage/' . $this->image_path);
        }
        $firstProductImg = $this->products()->with('images')->get()->pluck('images')->flatten()->first();
        if ($firstProductImg) {
            return asset('storage/' . $firstProductImg->displayPath());
        }
        return null;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
