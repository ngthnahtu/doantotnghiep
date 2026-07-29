<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract_Service extends Model
{
    protected $table='contract_services';
    protected $fillable = ['contract_id','service_id','current_index'];
    protected $casts = [
        'contract_id'=>'integer',
        'service_id'=>'integer',
        'current_index'=>'integer'
    ];
    public function contracts() : BelongsTo {
        return $this->belongsTo(Contract::class,'contract_id','id');
    }

    public function services() : BelongsTo {
        return $this->belongsTo(Service::class,'service_id','id');
    }
}
