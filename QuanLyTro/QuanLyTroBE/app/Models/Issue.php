<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Issue extends Model
{
    use SoftDeletes;
    protected $table='issues';
    protected $fillable = ['title','description','proof_image','status','note','room_id','tenant_id'];
    protected $casts = [
        'status'=>'integer',
        'room_id'=>'integer',
        'tenant_id'=>'integer'
    ];

    public function rooms():BelongsTo
    {
        return $this->belongsTo(Room::class,'room_id','id');
    }
    public function tenants() : BelongsTo {
        return $this->belongsTo(Tenant::class,'tenant_id','id');
    }
}
