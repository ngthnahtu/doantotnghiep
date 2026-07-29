<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice_Detail extends Model
{
    protected $table='invoice_details';
    protected $fillable = ['service_name_snapshot', 'old_index', 'new_index', 'unit_price_snapshot', 'subtotal', 'invoice_id','service_id'];
    protected $casts = [
        'old_index'=>'integer',
        'new_index'=>'integer',
        'unit_price_snapshot'=>'decimal:2',
        'subtotal'=>'decimal:2',
        'invoice_id'=>'integer',
        'service_id'=>'integer'
    ];
    public function invoice():BelongsTo
    {
        return $this->belongsTo(Invoice::class,'invoice_id','id');
    }
    public function services():BelongsTo
    {
        return $this->belongsTo(Service::class,'service_id','id')->withTrashed();
    }
}
