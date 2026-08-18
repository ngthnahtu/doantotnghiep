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
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('contract_code')->unique();
            $table->date('start_date');
            $table->date('end_date');
            $table->date('actual_end_date')->nullable();
            $table->decimal('rent_price',12,2);
            $table->decimal('deposit',12,2);
            $table->decimal('returned_deposit',12,2)->nullable();
            $table->tinyInteger('status')->default(0);
            $table->string('note')->nullable();
            
            $table->foreignId('room_id')->constrained('rooms')->onDelete('restrict');
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
