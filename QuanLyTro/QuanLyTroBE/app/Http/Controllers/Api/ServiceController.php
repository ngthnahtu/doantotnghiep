<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }
        $services = Service::orderBy('id', 'asc')->paginate(8);
        return response()->json([
            'message' => 'Tải danh sách dịch vụ thành công.',
            'data' => $services
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
        $validated = $request->validate(
            [
                'name' => 'required|string|max:191',
                'price' => 'required|numeric|min:0',
                'charge_type' => 'required|integer'
            ],
            [
                'name.required' => 'Tên dịch vụ không được để trống.',
                'price.required' => 'Giá dịch vụ không được để trống.',
                'price.numeric' => 'Giá dịch vụ phải là số.',
                'price.min' => 'Giá dịch vụ không được là số âm.',
                'charge_type.required' => 'Đơn vị tính không được bỏ trống.'
            ]
        );
        $service = Service::create($validated);
        return response()->json([
            'message' => "Thêm dịch vụ {$service->name} mới thành công",
            'data' => $service
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
        $service = Service::find($id);
        if (!$service) {
            return response()->json([
                'message' => 'Không tìm thấy dịch vụ này'
            ], 404);
        }
        return response()->json([
            'message' => "Lấy thông tin dịch vụ {$service->name} thành công.",
            'data' => $service
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
        $service = Service::find($id);
        if (!$service) {
            return response()->json([
                'message' => 'Không tìm thấy dịch vụ này.'
            ], 404);
        }
        $validated = $request->validate(
            [
                'name' => 'required|string|max:191',
                'price' => 'required|numeric|min:0',
                'charge_type' => 'required|integer'
            ],
            [
                'name.required' => 'Tên dịch vụ không được để trống.',
                'price.required' => 'Giá dịch vụ không được để trống.',
                'price.numeric' => 'Giá dịch vụ phải là số.',
                'price.min' => 'Giá dịch vụ không được là số âm.',
                'charge_type.required' => 'Đơn vị tính không được bỏ trống.'
            ]
        );
        $service->update($validated);
        return response()->json([
            'message' => "Cập nhật thông tin dịch vụ {$service->name} thành công.",
            'data' => $service
        ], 200);
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
        $service = Service::find($id);
        if (!$service) {
            return response()->json([
                'message' => 'Không tìm thấy dịch vụ này.'
            ], 404);
        }
        if ($service->contract_services()->exists()) {
            return response()->json([
                'message' => 'Không thể xóa dịch vụ này vì đang được sử dụng trong hợp đồng.'
            ], 422);
        }
        $serviceName = $service->name;
        $service->delete();
        return response()->json([
            'message' => "Xóa dịch vụ {$serviceName} thành công"
        ], 200);
    }

    public function options()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }
        
        $services = Service::select('id', 'name', 'price','charge_type')->orderBy('charge_type')->get();
        return response()->json([
            'message' => 'Tải danh sách dịch vụ thành công.',
            'data' => $services
        ], 200);
    }
}
