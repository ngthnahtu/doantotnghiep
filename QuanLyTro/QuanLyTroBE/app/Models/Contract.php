<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use SoftDeletes;
    protected $table='contracts';
    protected $fillable = [
        'contract_code',
        'start_date',
        'end_date',
        'actual_end_date',
        'rent_price',
        'deposit',
        'returned_deposit',
        'status',
        'note',
        'room_id',
        'tenant_id'
    ];
    protected $casts = [
        'start_date'=>'date',
        'end_date'=>'date',
        'actual_end_date'=>'date',
        'rent_price'=>'decimal:2',
        'deposit'=>'decimal:2',
        'returned_deposit'=>'decimal:2',
        'status'=>'integer',
        'room_id'=>'integer',
        'tenant_id'=>'integer'
    ];
    
    public function tenants():BelongsTo
    {
        return $this->belongsTo(Tenant::class,'tenant_id','id');
    }

    public function rooms():BelongsTo
    {
        return $this->belongsTo(Room::class,'room_id','id')->withTrashed();
    }

    public function contract_services():HasMany
    {
        return $this->hasMany(Contract_Service::class,'contract_id','id');
    }

    public function room_members():HasMany
    {
        return $this->hasMany(Room_Member::class,'contract_id','id');
    }

    public function invoices():HasMany
    {
        return $this->hasMany(Invoice::class,'contract_id','id');
    }
}
