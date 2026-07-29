<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notification extends Model
{
    protected $table='notifications';
    protected $fillable = ['title','content','type','target_type'];
    protected $casts = [
        'type'=>'integer',
        'target_type'=>'boolean'
    ];
    public function notification_users():HasMany
    {
        return $this->hasMany(Notification_User::class,'notification_id','id');
    }
}
