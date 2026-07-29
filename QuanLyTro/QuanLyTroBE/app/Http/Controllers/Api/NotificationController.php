<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Notification_User;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy người dùng.'
            ], 404);
        }
        $view = $request->query('view', 'manage');

        if ($view === 'bell') {
            if ((int) $user->role === 1) {
                $noti = Notification::where(function ($query) use ($user) {
                    $query->where('target_type', true)
                        ->orWhereHas('notification_users', function ($query) use ($user) {
                            $query->where('user_id', $user->id);
                        });
                })
                    ->with([
                        'notification_users' => function ($query) use ($user) {
                            $query->where('user_id', $user->id);
                        }
                    ])
                    ->orderBy('created_at', 'desc')
                    ->paginate(7);
            } else {
                $noti = Notification::whereHas(
                    'notification_users',
                    function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    }
                )
                    ->with([
                        'notification_users' => function ($query) use ($user) {
                            $query->where('user_id', $user->id);
                        }
                    ])
                    ->orderBy('created_at', 'desc')
                    ->paginate(8);
            }
        } else {
            if ((int) $user->role !== 0) {
                return response()->json([
                    'message' => 'Bạn không có quyền truy cập trang quản lý này.'
                ], 403);
            }

            $noti = Notification::orderBy('created_at', 'desc')
                ->paginate(8);
        }

        return response()->json([
            'message' => 'Tải danh sách thông báo thành công.',
            'data' => $noti
        ], 200);
    }

    /**
     * Store
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user || (int) $user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền thực hiện hành động này.'
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:191',
            'content' => 'nullable|string|max:255',
            'type' => 'required|integer',
            'target_type' => 'required|boolean',
            'user_id' => 'required_if:target_type,0,false|array|min:1',
            'user_id.*' => 'integer|distinct|exists:users,id'
        ], [
            'title.required' => 'Tiêu đề không được bỏ trống.',
            'title.max' => 'Tiêu đề không vượt quá 191 kí tự.',
            'content.max' => 'Nội dung không được vượt quá 255 kí tự.',
            'type.required' => 'Loại thông báo không được bỏ trống.',
            'target_type.required' => 'Đối tượng gửi không được bỏ trống.',
            'user_id.required_if' => 'Vui lòng chọn danh sách người nhận.',
            'user_id.min' => 'Vui lòng chọn ít nhất một người nhận.',
            'user_id.*.distinct' => 'Danh sách người nhận đang bị trùng.',
            'user_id.*.exists' => 'Người nhận được chọn không tồn tại.'
        ]);

        $noti = DB::transaction(function () use ($validated) {
            $notification = Notification::create([
                'title' => $validated['title'],
                'content' => $validated['content'] ?? null,
                'type' => $validated['type'],
                'target_type' => $validated['target_type']
            ]);

        
            if (!$validated['target_type']) {
                foreach ($validated['user_id'] as $userId) {
                    Notification_User::create([
                        'is_read' => false,
                        'notification_id' => $notification->id,
                        'user_id' => $userId
                    ]);
                }
            }

            return $notification;
        });

        return response()->json([
            'message' => 'Thêm thông báo mới thành công.',
            'data' => $noti
        ], 201);
    }

    /**
     * Show
     */
    public function show(string $id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy người dùng.'
            ], 404);
        }

        $noti = Notification::find($id);

        if (!$noti) {
            return response()->json([
                'message' => 'Không tìm thấy thông báo này.'
            ], 404);
        }

        if ((int) $user->role !== 0) {
            if (!$noti->target_type) {
                $canView = Notification_User::where(
                    'notification_id',
                    $noti->id
                )
                    ->where('user_id', $user->id)
                    ->exists();

                if (!$canView) {
                    return response()->json([
                        'message' => 'Bạn không có quyền xem thông báo này.'
                    ], 403);
                }
            }
        }

        return response()->json([
            'message' => 'Tải thông báo thành công.',
            'data' => $noti
        ], 200);
    }

    /**
     * Update
     *
     * 
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();

        if (!$user || (int) $user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền thực hiện hành động này.'
            ], 403);
        }

        $noti = Notification::find($id);

        if (!$noti) {
            return response()->json([
                'message' => 'Không tìm thấy thông báo này.'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:191',
            'content' => 'nullable|string|max:255',
            'type' => 'required|integer'
        ], [
            'title.required' => 'Tiêu đề không được bỏ trống.',
            'title.max' => 'Tiêu đề không vượt quá 191 kí tự.',
            'content.max' => 'Nội dung không được vượt quá 255 kí tự.',
            'type.required' => 'Loại thông báo không được bỏ trống.'
        ]);

        $noti->update($validated);

        return response()->json([
            'message' => 'Sửa thông báo thành công.',
            'data' => $noti
        ], 200);
    }

    /**
     * destroy
     */
    public function destroy(string $id)
    {
        $user = Auth::user();

        if (!$user || (int) $user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền thực hiện hành động này.'
            ], 403);
        }

        $noti = Notification::find($id);

        if (!$noti) {
            return response()->json([
                'message' => 'Không tìm thấy thông báo này.'
            ], 404);
        }

        DB::transaction(function () use ($noti) {
            $noti->notification_users()->delete();
            $noti->delete();
        });

        return response()->json([
            'message' => 'Xóa thông báo thành công.'
        ], 200);
    }

    public function chooseUser()
    {
        $user = Auth::user();

        if (!$user || (int) $user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập.'
            ], 403);
        }

        $users = User::with('tenants')
            ->where('role', 1)
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        return response()->json([
            'message' => 'Tải danh sách người nhận thành công.',
            'data' => $users
        ], 200);
    }
}