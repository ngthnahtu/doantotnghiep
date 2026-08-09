<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Room_Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Room_MemberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'message' => 'Bạn chưa đăng nhập.'
            ], 401);
        }
        $contract_id = $request->query('contract_id');
        if (!$contract_id) {
            return response()->json(['message' => 'Vui lòng truyền mã hợp đồng để xem danh sách thành viên.'], 400);
        }
        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant) {
                return response()->json([
                    'message' => 'Không tìm thấy thông tin khách thuê này.'
                ], 404);
            }
            $contract = Contract::find($contract_id);

            if (!$contract || $contract->tenant_id !== $tenant->id) {
                return response()->json([
                    'message' => 'Bạn không có quyền truy cập danh sách thành viên phòng khác.'
                ], 403);
            }
            $roomMember = Room_Member::where('contract_id', $contract_id)->select('id', 'name', 'relationship')->get();
        } else {
            $roomMember = Room_Member::where('contract_id', $contract_id)->get();
        }
        return response()->json([
            'message' => 'Tải dữ liệu người ở cùng thành công.',
            'data' => $roomMember
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (Auth::user()->role !== 0) {
            return response()->json([
                'message' => 'Hành động không được phép. Chỉ Quản trị viên mới có quyền thêm thành viên.'
            ], 403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'birth' => 'required|date',
            'gender' => 'required|integer|in:0,1',
            'address' => 'required|string|max:191',
            'phone' => ['nullable', 'string', 'max:15', 'regex:/^(0)[0-9]{9,14}$/'],
            'identity_number' => ['required', 'string', 'max:50',],
            'relationship' => 'nullable|string|max:50',
            'contract_id' => 'required|integer|exists:contracts,id'
        ], [
            'contract_id.required' => 'Hợp đồng không hợp lệ.',
            'contract_id.exists' => 'Hợp đồng không tồn tại trên hệ thống.',
            'name.required' => 'Tên thành viên không được để trống.',
            'birth.required' => 'Ngày sinh không được để trống.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0, từ 10 kí tự và chỉ chứa số.',
            'identity_number.required' => 'Số CCCD/CMND không được để trống.',
        ]);

        $contract = Contract::find($validated['contract_id']);
        if (!$contract || (int)$contract->status !== 0) {
            return response()->json([
                'message' => 'Không thể thêm thành viên vì hợp đồng không còn hiệu lực.'
            ], 422);
        }

        $validated['status'] = 0;

        $roomMember = Room_Member::create($validated);
        return response()->json([
            'message' => 'Thêm thành viên vào phòng thành công.',
            'data' => $roomMember
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        if ($user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền xem chi tiết thành viên.'
            ], 403);
        }
        $member = Room_Member::find($id);

        if (!$member) {
            return response()->json(['message' => 'Không tìm thấy thành viên này.'], 404);
        }

        return response()->json([
            'message' => 'Lấy chi tiết thành viên thành công.',
            'data' => $member
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if (Auth::user()->role !== 0) {
            return response()->json([
                'message' => 'Hành động không được phép.'
            ], 403);
        }

        $member = Room_Member::find($id);
        if (!$member) {
            return response()->json(['message' => 'Không tìm thấy thành viên này.'], 404);
        }

        $contract = Contract::find($member->contract_id);
        if (!$contract || (int) $contract->status !== 0) {
            return response()->json([
                'message' => 'Không thể sửa thành viên vì hợp đồng không còn hiệu lực.'
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:191',
            'birth' => 'required|date',
            'gender' => 'required|integer|in:0,1',
            'address' => 'required|string|max:191',
            'phone' => ['nullable', 'string', 'max:15', 'regex:/^(0)[0-9]{9,14}$/'],
            'identity_number' => ['required', 'string', 'max:50'],
            'relationship' => 'nullable|string|max:50'
        ], [
            'name.required' => 'Tên thành viên không được để trống.',
            'birth.required' => 'Ngày sinh không được để trống.',
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0, từ 10 kí tự và chỉ chứa số.',
            'identity_number.required' => 'Số CCCD/CMND không được để trống.',
        ]);

        $member->update($validated);

        return response()->json([
            'message' => 'Cập nhật thông tin thành viên thành công.',
            'data' => $member
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        if (Auth::user()->role !== 0) {
            return response()->json([
                'message' => 'Hành động không được phép.'
            ], 403);
        }

        $roomMember = Room_Member::find($id);
        if (!$roomMember) {
            return response()->json(['message' => 'Không tìm thấy thành viên này.'], 404);
        }

        $contract = Contract::find($roomMember->contract_id);
        if (!$contract || (int) $contract->status !== 0) {
            return response()->json([
                'message' => 'Không thể xóa thành viên vì hợp đồng không còn hiệu lực.'
            ], 422);
        }

        $roomMember->delete();

        return response()->json([
            'message' => 'Xóa thành viên ra khỏi phòng thành công.'
        ], 200);
    }
}
