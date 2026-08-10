<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Throwable;

class TenantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }

        $search = trim($request->search ?? '');
        $filter= trim($request->filter ?? '');

        $tenants= Tenant::query()->with('users')
        ->when($search !== '', function($query) use($search){
            $query->where(function($q) use ($search){
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('identity_number', 'like', "%{$search}%")
                ->orWhereHas('users',function($userquery) use ($search){
                    $userquery->where('email', 'like',"%{$search}%");
                });
            });
        })->when($filter !== '',function($q) use($filter){
            $q->where('status',$filter);
        })
        ->orderBy('status','asc')->paginate(8);

        return response()->json([
            'message' => 'Tải danh sách khách thuê thành công.',
            'data' => $tenants
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
            'name' => 'required|string|max:191',
            'birth' => 'required|date|before_or_equal:today',
            'gender' => 'required|integer|in:0,1',
            'address' => 'required|string|max:191',
            'phone' => [
                'required',
                'string',
                'max:15',
                'regex:/^(0)[0-9]{9,14}$/',
                'unique:users,phone',
                Rule::unique('tenants', 'phone')->whereNull('deleted_at')
            ],
            'identity_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('tenants','identity_number')->whereNull('deleted_at')
            ],
            'password' => 'required|string|min:6',
            'email' => 'nullable|email|max:191',
        ], [
            'name.required' => 'Tên khách thuê không được để trống.',
            'birth.required' => 'Ngày sinh không được để trống.',
            'phone.required' => 'Số điện thoại không được để trống.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0, từ 10 kí tự và chỉ chứa số.',
            'phone.unique' => 'Số điện thoại này đã tồn tại trên hệ thống.',
            'identity_number.required' => 'Số CCCD/CMND không được để trống.',
            'identity_number.unique' => 'Số CCCD/CMND này đã được đăng ký.',
            'password.required' => 'Mật khẩu đăng nhập khởi tạo không được để trống.',
            'password.min' => 'Mật khẩu phải chứa ít nhất 6 ký tự.',
            'email.email' => 'Định dạng email không hợp lệ.',
            'gender.in' => 'Giới tính không hợp lệ.',
            'birth.before_or_equal'=>'Ngày sinh không được lớn hơn hôm nay.'
        ]);

        $tenant = DB::transaction(function () use ($validated) {
            $user = User::create([
                'phone' => $validated['phone'],
                'email' => $validated['email'] ?? null,
                'password' => $validated['password'],
                'role' => 1,
                'is_active' => true
            ]);
            $tenant = Tenant::create([
                'name' => $validated['name'],
                'birth' => $validated['birth'],
                'gender' => $validated['gender'],
                'address' => $validated['address'],
                'phone' => $validated['phone'],
                'identity_number' => $validated['identity_number'],
                'status' => 0,
                'user_id' => $user->id
            ]);
            return $tenant;
        });
        return response()->json([
            'message' => "Thêm khách thuê {$tenant->name} mới và tạo tài khoản thành công",
            'data' => $tenant->load('users')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }

        $tenant = Tenant::with('users')->find($id);
        if (!$tenant) {
            return response()->json([
                'message' => 'Không tìm thấy khách thuê này.'
            ], 404);
        }
        return response()->json([
            'message' => "Lấy thông tin khách thuê {$tenant->name} thành công.",
            'data' => $tenant
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }

        $tenant = Tenant::find($id);
        if (!$tenant) {
            return response()->json([
                'message' => 'Không tìm thấy khách thuê này.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'birth' => 'required|date|before_or_equal:today',
            'gender' => 'required|integer|in:0,1',
            'address' => 'required|string|max:191',
            'phone' => [
                'required',
                'string',
                'max:15',
                'regex:/^(0)[0-9]{9,14}$/',
                Rule::unique('users', 'phone')->ignore($tenant->user_id, 'id'),
                Rule::unique('tenants', 'phone')->ignore($tenant->id, 'id')->whereNull('deleted_at')
            ],
            'identity_number' => ['required', 'string', 'max:50', Rule::unique('tenants', 'identity_number')->ignore($id)->whereNull('deleted_at')],
            'status' => 'required|integer|in:0,1,2',
            'email' => 'nullable|email|max:191',
            'password' => 'nullable|string|min:6',
            'is_active' => 'required|boolean',
        ], [
            'name.required' => 'Tên khách thuê không được để trống.',
            'birth.required' => 'Ngày sinh không được để trống.',
            'phone.required' => 'Số điện thoại không được để trống.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0, từ 10 kí tự và chỉ chứa số.',
            'phone.unique' => 'Số điện thoại này đã tồn tại trên hệ thống.',
            'identity_number.required' => 'Số CCCD/CMND không được để trống.',
            'identity_number.unique' => 'Số CCCD/CMND này đã được đăng ký.',
            'password.min' => 'Mật khẩu phải chứa ít nhất 6 ký tự.',
            'email.email' => 'Định dạng email không hợp lệ.',
            'is_active.required' => 'Trạng thái không được để trống',
            'gender.in' => 'Giới tính không hợp lệ.',
            'status.in' => 'Trạng thái khách thuê không hợp lệ.',
            'is_active.boolean' => 'Trạng thái tài khoản không hợp lệ.',
            'birth.before_or_equal'=>'Ngày sinh không được lớn hơn hôm nay.'
        ]);
        try {
            $hasContractActive = $tenant->contracts()->where('status', 0)->exists();
            if ($hasContractActive && ($validated['status'] == 0 || $validated['status'] == 2)) {
                return response()->json([
                    'message' => 'Không thể chuyển khách thuê về trạng thái trống khi còn hợp đồng hiệu lực.'
                ], 422);
            }
            DB::transaction(function () use ($tenant, $validated) {
                $tenant->update([
                    'name' => $validated['name'],
                    'birth' => $validated['birth'],
                    'gender' => $validated['gender'],
                    'address' => $validated['address'],
                    'phone' => $validated['phone'],
                    'identity_number' => $validated['identity_number'],
                    'status' => $validated['status'],
                ]);
                if ($tenant->user_id) {
                    $user = User::find($tenant->user_id);
                    if ($user) {
                        $userData = [
                            'phone' => $validated['phone'],
                            'email' => $validated['email'] ?? null,
                            'is_active' => $validated['is_active'],
                        ];
                        if (!empty($validated['password'])) {
                            $userData['password'] = $validated['password'];
                        }
                        $user->update($userData);
                        if(!$validated['is_active']){
                            $user->tokens()->delete();
                        }
                    }
                }
            });
            return response()->json([
                'message' => "Cập nhật thông tin khách thuê {$tenant->name} thành công.",
                'data' => $tenant->load('users')
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Cập nhật thông tin thất bại.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }

        $tenant = Tenant::find($id);

        if (!$tenant) {
            return response()->json([
                'message' => 'Không tìm thấy khách thuê này.'
            ], 404);
        }

        $hasContract = $tenant->contracts()->withTrashed()->exists();

        if ($hasContract) {
            return response()->json([
                'message' => 'Không thể xóa khách thuê này do đã từng có hợp đồng.'
            ], 422);
        }
        $tenantName = $tenant->name;
        DB::transaction(function () use ($tenant) {
            if ($tenant->user_id) {
                $user = User::find($tenant->user_id);
                if ($user) {
                    $user->delete();
                }
            }
            $tenant->delete();
        });
        return response()->json([
            'message' => "Xóa khách thuê {$tenantName} và tài khoản liên kết thành công."
        ], 200);
    }

    public function options()
    {
        $tenant = Tenant::where('status', 0)->select('id', 'name', 'phone', 'identity_number')
            ->orderBy('created_at')->get();
        return response()->json([
            'message' => 'Tải danh sách khách thuê khả dụng thành công.',
            'data' => $tenant
        ], 200);
    }
}
