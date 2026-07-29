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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_code')->unique();
            //  YYYY-MM cho bill
            $table->string('bill_month',7);
            $table->decimal('room_price_snapshot',12,2);
            $table->decimal('total_amount',12,2);
            $table->decimal('paid_amount',12,2)->default(0);
            $table->decimal('remain_amount',12,2);
            $table->tinyInteger('status')->default(0);
            $table->date('due_date');
            $table->string('note')->nullable();
            $table->foreignId('room_id')->constrained('rooms')->onDelete('restrict');
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
