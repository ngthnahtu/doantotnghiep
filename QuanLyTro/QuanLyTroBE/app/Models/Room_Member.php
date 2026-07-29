<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Room_Member extends Model
{
    use SoftDeletes;
    protected $table='room_members';
    protected $fillable = ['name','birth','gender','address','phone','identity_number','relationship','status','contract_id',];
    protected $casts = [
        'birth'=>'date',
        'gender'=>'integer',
        'status'=>'integer',
        'contract_id'=>'integer',
    ];
    public function contracts():BelongsTo
    {
        return $this->belongsTo(Contract::class,'contract_id','id');
    }
}
