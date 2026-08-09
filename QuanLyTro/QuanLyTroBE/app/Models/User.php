<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable; //Kích hoạt HasApiTokens

    protected $table = 'users';
    protected $fillable = ['phone', 'email', 'password', 'role', 'is_active'];
    
    // giấu khi  trả về json cho raeact
    protected $hidden = ['password'];

    protected $casts = [
        'password' => 'hashed',
        'role' => 'integer',
        'is_active' => 'boolean',
    ];

    public function tenants(): HasOne
    {
        return $this->hasOne(Tenant::class, 'user_id', 'id');
    }
    public function notification_users(): HasMany
    {
        return $this->hasMany(Notification_User::class, 'user_id', 'id');
    }
}
