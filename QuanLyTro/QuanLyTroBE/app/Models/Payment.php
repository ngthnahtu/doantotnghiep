<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $table='payments';
    protected $fillable = ['payment_code','amount','payment_method','proof_image','status','note','payment_date','approved_at','invoice_id'];
    protected $casts = [
        'amount'=>'decimal:2',
        'payment_method'=>'integer',
        'status'=>'integer',
        'payment_date'=>'date',
        'approved_at'=>'date',
        'invoice_id'=>'integer'
    ];
    public function invoices():BelongsTo
    {
        return $this->belongsTo(Invoice::class,'invoice_id','id');
    }
}
