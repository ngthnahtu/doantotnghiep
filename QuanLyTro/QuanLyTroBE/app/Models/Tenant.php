<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;
    protected $table = 'tenants';
    protected $fillable = ['name', 'birth', 'gender', 'address', 'phone', 'identity_number', 'status', 'user_id'];

    protected $casts = [
        'birth' => 'date',
        'gender' => 'integer',
        'status' => 'integer',
        'user_id' => 'integer'
    ];
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'tenant_id', 'id');
    }
    public function issues(): HasMany
    {
        return $this->hasMany(Issue::class, 'tenant_id', 'id');
    }
}
