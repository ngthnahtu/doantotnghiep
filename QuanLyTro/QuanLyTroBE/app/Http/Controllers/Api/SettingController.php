<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SettingController extends Controller
{

    public function show()
    {
        $user = User::findOrFail(Auth::id());

        $system = Setting::query()->first();

        return response()->json([
            'message' => 'Tải thông tin cài đặt thành công.',
            'data' => [
                'account' => [
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'system' => $system,
            ],
        ], 200);
    }

    public function updateAccount(Request $request)
    {
        $user = User::findOrFail(Auth::id());

        $rules = [
            'email' => [
                'nullable',
                'email',
                'max:191',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ];
        if ((int) $user->role === 0) {
            $rules['phone'] = [
                'required',
                'string',
                'max:15',
                'regex:/^(0)[0-9]{9,14}$/',
                Rule::unique('users', 'phone')->ignore($user->id),
            ];
        }

        $validated = $request->validate($rules, [
            'phone.required' => 'Số điện thoại không được bỏ trống.',
            'phone.unique' => 'Số điện thoại đã được sử dụng.',
            'phone.max' => 'Số điện thoại không hợp lệ.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email đã được sử dụng.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0, có từ 10 đến 15 chữ số và chỉ chứa số.',
        ]);

        if ((int) $user->role === 0) {
            $user->phone = $validated['phone'];
        }
        $user->email = $validated['email'] ?? null;

        $user->save();

        return response()->json([
            'message' => 'Cập nhật tài khoản thành công.',
            'data' => [
                'id' => $user->id,
                'phone' => $user->phone,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 200);
    }

    public function updatePassword(Request $request)
    {
        $user = User::findOrFail(Auth::id());

        $validated = $request->validate([
            'current_password' => ['required', 'string',],
            'password' => ['required', 'string', 'min:6', 'confirmed',],
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.min' => 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không chính xác.',
        ]);

        if (!Hash::check(
            $validated['current_password'],
            $user->password
        )) {
            return response()->json([
                'message' => 'Mật khẩu hiện tại không chính xác.',
            ], 422);
        }
        
        $user->password = $validated['password'];

        $user->save();

        return response()->json([
            'message' => 'Đổi mật khẩu thành công.',
        ], 200);
    }

    public function updateSystem(Request $request)
    {
        $user = User::findOrFail(Auth::id());

        if ((int) $user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền cập nhật cài đặt hệ thống.',
            ], 403);
        }

        $validated = $request->validate([
            'house_name' => ['nullable', 'string', 'max:191'],
            'house_address' => ['nullable', 'string', 'max:191'],
            'house_phone' => ['nullable', 'string', 'max:15'],
            'bank_name' => ['nullable', 'string', 'max:191'],
            'bank_number' => ['nullable', 'string', 'max:50'],
            'bank_owner' => ['nullable', 'string', 'max:191'],
        ], [
            'house_name.max' => 'Tên nhà trọ quá dài.',
            'house_address.max' => 'Địa chỉ quá dài.',
            'house_phone.max' => 'Số điện thoại không hợp lệ.',
            'bank_number.max' => 'Số tài khoản không hợp lệ.',
        ]);

        $setting = Setting::query()->first();

        if (!$setting) {
            $setting = new Setting();
        }

        $setting->fill($validated);
        $setting->save();

        return response()->json([
            'message' => 'Cập nhật cài đặt hệ thống thành công.',
            'data' => $setting,
        ], 200);
    }
}
