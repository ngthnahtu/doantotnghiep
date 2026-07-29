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
        Schema::create('invoice_details', function (Blueprint $table) {
            $table->id();
            $table->string('service_name_snapshot');
            $table->integer('old_index')->nullable();
            $table->integer('new_index')->nullable();
            $table->decimal('unit_price_snapshot',12,2);
            $table->decimal('subtotal',12,2);
            //hóa đơn tổng bị xóa thì chi tiết biến mất theo (Cascade)
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            //nếu dịch vụ tổng bị xóa khỏi danh mục, hóa đơn cũ vẫn giữ nguyên (Set Null)
            $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_details');
    }
};
