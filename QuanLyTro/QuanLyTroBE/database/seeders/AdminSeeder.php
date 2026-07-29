<?php

namespace Database\Seeders;

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
        if (!User::where('phone', '0987654321')->exists()) {
            User::create([
                'phone' => 'admin',      // 🌟 Số điện thoại dùng để đăng nhập Admin trên Postman/ReactJS
                'email' => 'admin_simplehouse.com',
                'password' => '123456',        // 🌟 Mật khẩu thuần túy, Model User (có 'password' => 'hashed') sẽ tự động hash nó xuống DB
                'role' => 0,                  // 0: Quyền Admin (Chủ trọ)
                'is_active' => true           // true (hoặc 1): Trạng thái đang hoạt động
            ]);
        }
    }
}
