<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageTemplate extends Model
{
    public const CREATED_AT = null;

    protected $fillable = ['name', 'template_body'];
}
