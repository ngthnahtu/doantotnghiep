<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Notification_User;
use Illuminate\Support\Facades\Auth;

class Notification_UserController extends Controller
{
    /**
     * Update the specified resource in storage.
     */
    public function update(string $id)
    {
        $user = Auth::user();

        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json([
                'message' => 'Không tìm thấy thông báo này.'
            ], 404);
        }

        if ($notification->target_type) {
            $notification_user = Notification_User::updateOrCreate([
                'user_id' => $user->id,
                'notification_id' => $notification->id
            ], [
                'is_read' => true
            ]);
        } else {
            $notification_user = Notification_User::where('notification_id', $notification->id)
                ->where('user_id', $user->id)->first();

            if (!$notification_user) {
                return response()->json([
                    'message' => 'Bạn không có quyền truy cập thông báo này.'
                ], 403);
            }

            $notification_user->update([
                'is_read' => true
            ]);
        }
        return response()->json([
            'message' => 'Đã đọc thông báo',
            'data' => $notification_user
        ], 200);
    }
}
