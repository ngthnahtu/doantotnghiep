<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('birth');
            $table->tinyInteger('gender');
            $table->string('address');
            $table->string('phone',15);
            $table->string('identity_number');
            $table->tinyInteger('status')->default(0);
            // không ->onDelete('cascade') vì khi xóa mềm tài khoản, 
            // nó sẽ ngừng hoạt động tài khoản đăng nhập thôi
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
