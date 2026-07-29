<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends Model
{
    use SoftDeletes;
    protected $table = 'rooms';
    protected $fillable = ['room_name', 'floor', 'base_price', 'area', 'status', 'image', 'description'];
    protected $casts = [
        'floor' => 'integer',
        'base_price' => 'decimal:2',
        'area' => 'decimal:2',
        'status' => 'integer',
    ];
    public function issues(): HasMany
    {
        return $this->hasMany(Issue::class, 'room_id', 'id');
    }
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'room_id', 'id');
    }
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'room_id', 'id');
    }
}
