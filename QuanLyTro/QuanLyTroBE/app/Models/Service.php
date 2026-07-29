<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use SoftDeletes;
    protected $table = 'services';
    protected $fillable = ['name', 'price', 'charge_type'];

    protected $casts = [
        'price' => 'decimal:2',
        'charge_type' => 'integer',
    ];

    public function contract_services(): HasMany
    {
        return $this->hasMany(Contract_Service::class, 'service_id', 'id');
    }
    public function invoice_details(): HasMany
    {
        return $this->hasMany(Invoice_Detail::class, 'service_id', 'id');
    }
}
