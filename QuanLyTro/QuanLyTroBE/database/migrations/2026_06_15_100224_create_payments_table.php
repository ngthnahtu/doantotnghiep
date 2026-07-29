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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_code')->unique();
            $table->decimal('amount',12,2);
            $table->tinyInteger('payment_method')->default(0)->comment('0: tien mat, 1:chuyen khoan');
            $table->string('proof_image')->nullable();
            $table->tinyInteger('status')->default(0);
            $table->string('note')->nullable();
            $table->timestamp('payment_date')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
