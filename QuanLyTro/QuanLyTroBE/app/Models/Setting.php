<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'settings';

    protected $fillable = [
        'house_name',
        'house_address',
        'house_phone',
        'bank_name',
        'bank_number',
        'bank_owner',
    ];
}