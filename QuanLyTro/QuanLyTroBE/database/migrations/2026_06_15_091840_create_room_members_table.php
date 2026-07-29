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
        Schema::create('room_members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('birth');
            $table->tinyInteger('gender');
            $table->string('address');
            $table->string('phone',15)->nullable();
            $table->string('identity_number');
            $table->string('relationship')->nullable();
            $table->tinyInteger('status')->default(0);
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_members');
    }
};
