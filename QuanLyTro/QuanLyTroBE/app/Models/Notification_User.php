<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification_User extends Model
{
    protected $table='notification_users';
    protected $fillable = ['is_read','notification_id','user_id'];
    protected $casts = [
        'notification_id'=>'integer',
        'user_id'=>'integer'
        ];
    public function notifications():BelongsTo
    {
        return $this->belongsTo(Notification::class,'notification_id','id');
    }
    public function users() : BelongsTo {
        return $this->belongsTo(User::class,'user_id','id');
    }
}
