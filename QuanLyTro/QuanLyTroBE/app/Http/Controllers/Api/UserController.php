<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Throwable;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::orderBy('id', 'asc')->paginate(8);
        return response()->json([
            'message' => 'Tải danh sách người dùng thành công.',
            'data' => $users
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }

        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'max:15',
                'regex:/^(0)[0-9]{9,14}$/',
                'unique:users,phone',
                Rule::unique('tenants', 'phone')->whereNull('deleted_at')
            ],
            'email' => 'nullable|email|max:191',
            'password' => 'required|string|min:6',
            'is_active' => 'required|boolean',
            'role' => 'required|integer|in:0,1'
        ], [
            'phone.required' => 'Số điện thoại không được để trống.',
            'phone.unique' => 'Số điện thoại này đã tồn tại trên hệ thống.',
            'phone.max' => 'Số điện thoại không được vượt quá 15 kí tự.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0, từ 10 kí tự và chỉ chứa số.',
            'email.email' => 'Định dạng email không hợp lệ.',
            'password.required' => 'Mật khẩu không được để trống.',
            'password.min' => 'Mật khẩu phải chứa ít nhất 6 ký tự.',
            'is_active.required' => 'Trạng thái hoạt động không được để trống.',
        ]);

        $user = User::create($validated);
        return response()->json([
            'message' => 'Tạo tài khoản mới thành công',
            'data' => $user
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy tài khoản này.'
            ], 404);
        }
        return response()->json([
            'message' => "Lấy thông tin tài khoản {$user->phone} thành công.",
            'data' => $user
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = User::with('tenants')->find($id);
        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy tài khoản này.'
            ], 404);
        }

        $tenantID = $user->tenants?->id;
        $validated = $request->validate(
            [
                // .$id bỏ qua kiểm tra trùng với chính nó
                'phone' => [
                    'required',
                    'string',
                    'max:15',
                    'regex:/^(0)[0-9]{9,14}$/',
                    Rule::unique('users', 'phone')->ignore($id),
                    Rule::unique('tenants', 'phone')->ignore($tenantID)->whereNull('deleted_at')
                ],
                'email' => 'nullable|email|max:191',
                // nếu người dùng k nhập gì sẽ giữ nguyên mk cũ
                'password' => 'nullable|string|min:6',
                'role' => 'required|integer|in:0,1',
                'is_active' => 'required|boolean',
            ],
            [
                'phone.required' => 'Số điện thoại không được để trống.',
                'phone.unique' => 'Số điện thoại này đã tồn tại trên hệ thống.',
                'phone.max' => 'Số điện thoại không được vượt quá 15 kí tự.',
                'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0, từ 10 kí tự và chỉ chứa số.',
                'email.email' => 'Định dạng email không hợp lệ.',
                'password.min' => 'Mật khẩu phải chứa ít nhất 6 ký tự.',
                'role.required' => 'Vai trò tài khoản không được để trống.',
                'is_active.required' => 'Trạng thái hoạt động không được để trống.',
            ]
        );
        // Logic loại bỏ trường password rỗng để giữ lại mật khẩu cũ dưới DB
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        try {
            DB::transaction(function () use ($user, $validated) {
                $user->update($validated);
                if (!$validated['is_active']) {
                    $user->tokens()->delete();
                }
                
                $tenant = Tenant::where('user_id', $user->id)->first();
                if ($tenant) {
                    $tenant->update([
                        'phone' => $validated['phone'],
                    ]);
                }
            });

            return response()->json([
                'message' => "Cập nhật thông tin tài khoản {$user->phone} thành công.",
                'data' => $user->load('tenants')
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Cập nhật tài khoản thất bại.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $authUser = Auth::user();
        if (!$authUser || (int) $authUser->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập.'
            ], 403);
        }

        $targetUser = User::find($id);
        if (!$targetUser) {
            return response()->json([
                'message' => 'Không tìm thấy tài khoản này.'
            ], 404);
        }

        if ((int)$targetUser->role === 0) {
            return response()->json([
                'message' => 'Không thể xóa tài khoản Quản trị.'
            ], 422);
        }

        if ($targetUser->tenants()->exists()) {
            return response()->json([
                'message' => 'Không thể xóa tài khoản này do đang liên kết với khách thuê.'
            ], 422);
        }

        $phone = $targetUser->phone;
        $targetUser->delete();

        return response()->json([
            'message' => "Xóa tài khoản {$phone} thành công."
        ]);
    }
}
