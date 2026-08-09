<?php

use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\IssueController;
use App\Http\Controllers\Api\Notification_UserController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\Room_MemberController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;


Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (){
    
    Route::post('/logout',[AuthController::class,'logout']);
    Route::apiResource('issues', IssueController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('room-members', Room_MemberController::class);
    
    Route::get('contracts', [ContractController::class,'index']);
    Route::get('contracts/{id}',[ContractController::class,'show'])->whereNumber('id');

    Route::get('invoices',[InvoiceController::class,'index']);
    Route::get('invoices/{id}',[InvoiceController::class,'show'])->whereNumber('id');
    
    Route::apiResource('notification-users', Notification_UserController::class);
    
    Route::get('notifications', [NotificationController::class,'index']);
    Route::get('notifications/{id}', [NotificationController::class,'show'])->whereNumber('id');
    
    Route::get('settings', [SettingController::class,'show']);
    Route::put('settings/account', [SettingController::class,'updateAccount']);
    Route::put('settings/password', [SettingController::class,'updatePassword']);
    
    Route::middleware('can:isAdmin')->group(function () {
        
        Route::get('/rooms/options',[RoomController::class,'options']);
        Route::apiResource('rooms', RoomController::class);
        
        Route::get('/services/options',[ServiceController::class,'options']);
        Route::apiResource('services', ServiceController::class);

        Route::apiResource('users', UserController::class);

        Route::get('/tenants/options',[TenantController::class,'options']);
        Route::apiResource('tenants', TenantController::class);

        Route::get('/notifications/choose-user',[NotificationController::class, 'chooseUser']);
        Route::apiResource('notifications', NotificationController::class)->only(['store', 'update', 'destroy']);

        Route::get('invoices/prepare',[InvoiceController::class,'prepare']);
        Route::apiResource('invoices',InvoiceController::class)->only(['store','update','destroy']);

        Route::put('contracts/{id}/terminate',[ContractController::class,'terminate']);
        Route::apiResource('contracts', ContractController::class)->only(['store','update','destroy']);
        
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::put('settings/system', [SettingController::class,'updateSystem']);
    });
});
