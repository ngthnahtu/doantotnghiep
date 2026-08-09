<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'phone' => 'admin',
            'email' => 'admin_simplehouse.com',
            'password' => '123456',
            'role' => 0,
            'is_active' => true
        ]);
        Setting::create([
            'house_name'=>'Simple Home',
            'house_address'=>'180 Cao Lỗ, phường Chánh Hưng, TPHCM',
            'house_phone'=>'0902321704',
            'bank_name'=>'Vietcombank',
            'bank_number'=>'1019356507',
            'bank_owner'=>'Simple Home',
        ]);
    }
}
