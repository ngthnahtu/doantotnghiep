<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Models\Notification;
use App\Models\Notification_User;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class IssueController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant) {
                return response()->json([
                    'message' => 'Không tìm thấy khách thuê này',
                ], 404);
            }
            $issue = Issue::where('tenant_id', $tenant->id)->orderBy('created_at', 'desc')->paginate(8);
        } else {
            $issue = Issue::orderBy('created_at', 'desc')->paginate(8);
        }
        return response()->json([
            'message' => 'Tải danh sách các sự cố thành công.',
            'data' => $issue
        ], 200);
    }


    /**
     *
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'title' => 'required|string|max:191',
            'description' => 'nullable|string|max:255',
            'proof_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'note' => 'nullable|string|max:191',
        ], [
            'title.required' => 'Tiêu đề không được bỏ trống.',
            'title.max' => 'Tiêu đề không được quá dài.'
        ]);
        try {
            $issue = DB::transaction(function () use ($user, $validated,$request) {
                $tenant = $user->tenants;
                if (!$tenant) {
                    throw new \Exception('Không tìm thấy khách thuê hợp lệ.');
                }

                $contract = $tenant->contracts()->with('rooms')->where('status', 0)->first();
                if (!$contract) {
                    throw new \Exception('Tài khoản của bạn hiện chưa gắn với hợp đồng thuê phòng nào.');
                }

                $validated['room_id'] = $contract->room_id;
                $validated['tenant_id'] = $tenant->id;
                
                if($request->hasFile('proof_image')){
                    $validated['proof_image'] = $request->file('proof_image')->store('issues','public');
                }

                $issues = Issue::create($validated);

                $notification = Notification::create([
                    'title' => 'Sự cố: ' . $validated['title'],
                    'content' => 'Có báo cáo sự cố từ phòng ' . $contract->rooms->room_name . ': ' . $validated['description']??"Không có mô tả",
                    'type' => 1,
                    'target_type' => 0
                ]);
                $admin = User::where('role', 0)->first();
                $notification_user = Notification_User::create([
                    'notification_id' => $notification->id,
                    'user_id' => $admin->id
                ]);
                return $issues;
            });
            return response()->json([
                'message' => 'Sự cố đã được tiếp nhận.',
                'data' => $issue
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Có lỗi khi gửi yêu cầu.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $issue = Issue::find($id);
        if (!$issue) {
            return response()->json(['message' => 'Không tìm thấy sự cố này.'], 404);
        }
        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant || $issue->tenant_id != $tenant->id) {
                return response()->json(['message' => 'Bạn không có quyền truy cập sự cố này.'], 403);
            }
        }
        return response()->json([
            'message' => 'Lấy thông tin sự cố thành công.',
            'data' => $issue
        ], 200);
    }

    /**
     * 
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $issue = Issue::find($id);

        if (!$issue) {
            return response()->json(['message' => 'Không tìm thấy sự cố này.'], 404);
        }

        if ($user->role !== 0) {
            return response()->json(['message' => 'Chỉ có Quản trị viên mới được quyền cập nhật tiến độ sửa chữa.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|integer|in:0,1,2',
            'note' => 'nullable|string|max:255',
        ], [
            'status.required' => 'Vui lòng cập nhật trạng thái xử lý.',
            'status.in' => 'Trạng thái xử lý không hợp lệ.',
            'note.max' => 'Ghi chú không được vượt quá 255 kí tự.'
        ]);

        try {
            DB::transaction(function () use ($issue, $validated) {
                $issue->update([
                    'status' => $validated['status'],
                    'note' => $validated['note'] ?? $issue->note
                ]);

                $tenant = Tenant::find($issue->tenant_id);
                if ($tenant && $tenant->user_id) {
                    $statusText = 'Đang chờ tiếp nhận';
                    if ($validated['status'] == 1) $statusText = 'ĐANG ĐƯỢC SỬA CHỮA';
                    if ($validated['status'] == 2) $statusText = 'ĐÃ XỬ LÝ XONG';

                    $notification = Notification::create([
                        'title' => 'Cập nhật tiến độ sự cố: ' . $issue->title,
                        'content' => "Yêu cầu sửa chữa tại phòng của bạn hiện tại " . $statusText . ".",
                        'type' => 1,
                        'target_type' => false
                    ]);

                    Notification_User::create([
                        'notification_id' => $notification->id,
                        'user_id' => $tenant->user_id
                    ]);
                }
            });
            return response()->json([
                'message' => 'Cập nhật tiến độ xử lý sự cố thành công.',
                'data' => $issue
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Cập nhập thất bại',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        if (Auth::user()->role !== 0) {
            return response()->json(['message' => 'Hành động không được phép.'], 403);
        }
        $issue = Issue::find($id);
        if (!$issue) {
            return response()->json([
                'message' => 'Không tìm thấy sự cố này.'
            ], 404);
        }
        if($issue->proof_image){
            Storage::disk('public')->delete($issue->proof_image);
        }

        $issue->delete();
        return response()->json([
            'message' => 'Xóa thông tin sự cố thành công.',
            'data' => $issue
        ], 200);
    }
}
