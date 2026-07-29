<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use SoftDeletes;
    protected $table='invoices';
    protected $fillable = [
        'invoice_code','bill_month','room_price_snapshot',
        'total_amount', 'paid_amount', 'remain_amount', 'status',
        'due_date', 'note', 'room_id','contract_id'
    ];
    protected $casts = [
        'room_price_snapshot'=>'decimal:2',
        'total_amount'=>'decimal:2',
        'paid_amount'=>'decimal:2',
        'remain_amount'=>'decimal:2',
        'status'=>'integer',
        'due_date'=>'date',
        'room_id'=>'integer',
        'contract_id'=>'integer'
    ];

    public function contracts():BelongsTo
    {
        return $this->belongsTo(Contract::class,'contract_id','id');
    }

    public function rooms():BelongsTo
    {
        return $this->belongsTo(Room::class,'room_id','id')->withTrashed();
    }

    public function invoice_details():HasMany
    {
        return $this->hasMany(Invoice_Detail::class,'invoice_id','id');
    }

    public function payments():HasMany
    {
        return $this->hasMany(Payment::class,'invoice_id','id');
    }
}
