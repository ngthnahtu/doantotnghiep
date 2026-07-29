<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request){
        $validated=$request->validate([
            'phone'=>'required|string',
            'password'=>'required|string'
        ],[
            'phone.required' => 'Số điện thoại không được để trống.',
            'password.required' => 'Mật khẩu không được để trống.',
        ]);
        $user=User::where('phone',$validated['phone'])->first();
        
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Số điện thoại hoặc mật khẩu không chính xác.'
            ], 401);
        }

        if ($user->is_active != 1) {
            return response()->json([
                'message' => 'Tài khoản của bạn đã bị ngưng hoạt động.'
            ], 401);
        }
        $token=$user->createToken('Token')->plainTextToken;
        return response()->json([
            'message'=>'Đăng nhập thành công.',
            'access_token'=>$token,
            'token_type'=>'Bearer',
            'user'=>[
                'id'=>$user->id,
                'phone'=>$user->phone,
                'role' => $user->role
            ],
        ],200);
    }
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'message'=>'Đăng xuất thành công.'
        ],200);
    }
}
