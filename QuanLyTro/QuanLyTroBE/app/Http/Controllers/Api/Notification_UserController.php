<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Notification_User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Notification_UserController extends Controller
{
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user=Auth::user();

        $notificationExist=Notification::where('id',$id)->exists();
        if (!$notificationExist) {
            return response()->json([
                'message' => 'Không tìm thấy thông báo này.'
            ], 404);
        }
        
        $noti=Notification_User::updateOrCreate([
            'user_id'=>$user->id,
            'notification_id'=>$id
        ],[
            'is_read'=>true
        ]);
        return response()->json([
            'message' => 'Đã đọc thông báo',
            'data' => $noti
        ], 200);
    }
}
