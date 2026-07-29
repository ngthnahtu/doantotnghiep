<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // vì mặt định kiểu string là 255 kí tự, mã hóa utf8mb4(4 bytes/kí tự sẽ bị tràn 1000 bytes bị sql từ chhoois)
        //  nên cần đặt giới hạn cho kí tự string
        // Trong cơ chế lưu trữ InnoDB đời cũ của MySQL, kích thước tối đa được trích ra 
        // từ một dòng dữ liệu để làm phân vùng tiền chỉ mục (Prefix Index) cho một cột 
        // đơn lẻ là 768 bytes nhằm tối ưu hóa bộ nhớ đệm RAM và tốc độ tìm kiếm.
        // Do đó: 768 bytes / 4 bytes (mã utf8mb4) = 192 ký tự. 
        // Trừ hao 1 ký tự kết thúc chuỗi, ta còn lại con số cấu hình chuẩn là 191.
        Schema::defaultStringLength(191);
        Gate::define('isAdmin',function (User $user){
            return $user->role===0;
        });
    }
}
