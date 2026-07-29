<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Contract_Service;
use App\Models\Invoice;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class ContractController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy người dùng này.',
            ], 403);
        }
        $query = Contract::with(['tenants', 'rooms', 'contract_services.services'])->orderBy('status', 'asc');
        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant) {
                return response()->json([
                    'message' => 'Không tìm thấy thông tin khách thuê này.'
                ], 404);
            }
            $query->where('tenant_id', $tenant->id);
        }
        $contract = $query->paginate(8);
        return response()->json([
            'message' => 'Tải danh sách hợp đồng thành công',
            'data' => $contract
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập.'
            ], 403);
        }
        $validated = $request->validate([
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'rent_price' => 'required|numeric|min:0',
            'deposit' => 'required|numeric|min:0',
            'note' => 'nullable|string|max:191',
            'room_id' => 'required|integer|exists:rooms,id',
            'tenant_id' => 'required|integer|exists:tenants,id',
            'services' => 'required|array|min:1',
            'services.*.service_id' => 'required|integer|distinct|exists:services,id',
            'services.*.current_index' => 'nullable|integer|min:0'
        ], [
            'start_date.required' => 'Ngày bắt đầu không được bỏ trống',
            'start_date.after_or_equal' => 'Ngày bắt đầu hợp đồng không hợp lệ.',
            'end_date.required' => 'Ngày kết thúc không được bỏ trống',
            'end_date.after' => 'Ngày kết thúc phải sau ngày bắt đầu hợp đồng.',
            'rent_price.required' => 'Giá phòng không được bỏ trống',
            'deposit.required' => 'Tiền cọc không được bỏ trống',

        ]);

        try {
            $room = Room::find($validated['room_id']);
            if (!$room) {
                return response()->json([
                    'message' => 'Không tìm thấy phòng này.'
                ], 404);
            }
            if ($room->status !== 0) {
                return response()->json([
                    'message' => 'Phòng được chọn không hợp lệ hoặc không còn trống.'
                ], 400);
            }

            $tenant = Tenant::find($validated['tenant_id']);
            if (!$tenant) {
                return response()->json([
                    'message' => 'Không tìm thấy khách thuê này.'
                ], 404);
            }
            if ($tenant->status !== 0) {
                return response()->json([
                    'message' => 'Khách thuê này hiện đang đứng tên một hợp đồng khác chưa thanh lý.'
                ], 400);
            }
            $contract = DB::transaction(function () use ($validated, $request) {
                $contracts = Contract::create(array_merge($validated, [
                    'contract_code' => 'TEMP-' . Str::random(10),
                ]));

                $contractCode = 'HĐ-' . date('Ymd') . "-" . str_pad($contracts->id, 5, 0, STR_PAD_LEFT);

                $contracts->update([
                    'contract_code' => $contractCode
                ]);

                foreach ($request->services as $service) {
                    Contract_Service::create([
                        'contract_id' => $contracts->id,
                        'service_id' => $service['service_id'],
                        'current_index' => $service['current_index'] ?? null
                    ]);
                }

                $room = Room::find($validated['room_id']);
                if ($room) {
                    $room->update(['status' => 1]);
                }

                $tenant = Tenant::find($validated['tenant_id']);
                if ($tenant) {
                    $tenant->update(['status' => 1]);
                }
                return $contracts;
            });
            return response()->json([
                'message' => 'Thêm hợp đồng mới thành công.',
                'data' => $contract->load(['rooms', 'tenants', 'contract_services.services'])
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Không thể tạo hợp đồng này',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $contract = Contract::with(['tenants', 'rooms', 'contract_services.services'])->find($id);
        if (!$contract) {
            return response()->json([
                'message' => 'Không tìm thấy hợp đồng này.'
            ], 404);
        }
        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant || $contract->tenant_id !== $tenant->id) {
                return response()->json(['message' => 'Bạn không có quyền truy cập thông tin hợp đồng này.'], 403);
            }
        }
        return response()->json([
            'message' => 'Lấy thông tin chi tiết hợp đồng thành công.',
            'data' => $contract
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        if ($user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }
        $contract = Contract::find($id);
        if (!$contract) {
            return response()->json(['message' => 'Không tìm thấy hợp đồng này.'], 404);
        }
        if ($contract->status !== 0) {
            return response()->json(['message' => 'Hợp đồng này đã kết thúc, không thể chỉnh sửa.'], 400);
        }
        $validated = $request->validate([
            'end_date' => 'required|date',
            'note' => 'nullable|string|max:191',
            'services' => 'required|array|min:1',
            'services.*.service_id' => 'required|integer|distinct|exists:services,id',
            'services.*.current_index' => 'nullable|integer|min:0'
        ], [
            'end_date.required' => 'Ngày kết thúc không được bỏ trống',
            'end_date.after' => 'Ngày kết thúc phải sau ngày bắt đầu hợp đồng.',
            'services.required' => 'Hợp đồng phải có ít nhất một dịch vụ.'
        ]);
        if ($validated['end_date'] <= $contract->start_date->format('Y-m-d')) {
            return response()->json([
                'message' => 'Ngày kết thúc phải sau ngày bắt đầu hợp đồng.'
            ], 422);
        }

        $hasInvoice = Invoice::where("contract_id", $contract->id)->exists();
        if ($hasInvoice) {
            foreach ($validated['services'] as $service) {
                $old_index = Contract_Service::where('contract_id', $contract->id)
                    ->where('service_id', $service['service_id'])->first();

                $newIndex = $service['current_index'] ?? null;

                if (
                    $old_index &&
                    (string) ($old_index->current_index ?? '') !==
                    (string) ($newIndex ?? '')
                ) {
                    return response()->json([
                        'message' =>
                        'Không thể sửa chỉ số dịch vụ vì hợp đồng đã phát sinh hóa đơn.'
                    ], 422);
                }
            }
        }

        try {
            DB::transaction(function () use ($contract, $validated, $request, $hasInvoice) {
                $contract->update($validated);
                $serviceID = collect($request->services)->pluck('service_id')->toArray();

                Contract_Service::where('contract_id', $contract->id)
                    ->whereNotIn('service_id', $serviceID)->delete();

                foreach ($validated['services'] as $service) {
                    $contractService = Contract_Service::firstOrNew([
                        'contract_id' => $contract->id,
                        'service_id' => $service['service_id']
                    ]);

                    if (!$hasInvoice || !$contractService->exists) {
                        $contractService->current_index =
                            $service['current_index'] ?? null;
                    }
                    $contractService->save();
                }
            });
            return response()->json([
                'message' => 'Cập nhật hợp đồng thành công.',
                'data' => $contract->load(['rooms', 'tenants'])
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Cập nhật hợp đồng thất bại.',
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
        $contract = Contract::find($id);

        if (!$contract) {
            return response()->json(['message' => 'Không tìm thấy hợp đồng này.'], 404);
        }

        if ($contract->status !== 0) {
            return response()->json([
                'message' => "Chỉ có thể xóa hợp đồng hiệu lực chưa phát sinh hóa đơn."
            ], 400);
        }

        $hasInvoice = Invoice::where('contract_id', $contract->id)->exists();
        if ($hasInvoice) {
            return response()->json([
                'message' => 'Hợp đồng đã phát sinh hóa đơn thu tiền, không thể hủy. Vui lòng thực hiện Thanh lý hợp đồng.'
            ], 400);
        }


        try {
            DB::transaction(function () use ($contract) {
                $contract->update(['status' => 2]);
                $contract->delete();

                $room = Room::find($contract->room_id);
                if ($room) {
                    $room->update(['status' => 0]);
                }
                $tenant = Tenant::find($contract->tenant_id);
                if ($tenant) {
                    $tenant->update(['status' => 0]);
                }
            });
            return response()->json(['message' => 'Hủy hợp đồng thành công.'], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Không thể xóa hợp đồng này.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function terminate(Request $request, string $id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }

        $contract = Contract::find($id);
        if (!$contract || $contract->status !== 0) {
            return response()->json(['message' => 'Không tìm thấy hợp đồng này, chỉ có thể thanh lý hợp đồng đang hiệu lực.'], 404);
        }

        $validated = $request->validate([
            'actual_end_date' => 'required|date|before_or_equal:today',
            'returned_deposit' => 'required|numeric|min:0'
        ], [
            'actual_end_date.required' => 'Ngày kết thúc thực tế không được bỏ trống',
            'actual_end_date.before_or_equal' => 'Ngày kết thúc thực tế không được lớn hơn hôm nay',
            'returned_deposit.required' => 'Tiền cọc hoàn trả không được bỏ trống.',
            'returned_deposit.min' => 'Tiền cọc hoàn trả không được nhỏ hơn 0.'
        ]);

        $actual_end_date = date('Y-m-d', strtotime($validated['actual_end_date']));
        if ($actual_end_date < $contract->start_date->format('Y-m-d')) {
            return response()->json([
                'message'
                => 'Ngày kết thúc thực tế phải sau hoặc bằng ngày bắt đầu.'
            ], 422);
        }

        $billMonth = date('Y-m', strtotime($validated['actual_end_date']));
        $hasFinalInvoice = Invoice::where('contract_id', $contract->id)->where('bill_month', $billMonth)->exists();

        if (!$hasFinalInvoice) {
            return response()->json([
                'message' => 'Vui lòng lập hóa đơn tháng ' . $billMonth . ' trước khi thanh lý hợp đồng.'
            ], 400);
        }
        $hasUnpaidInvoice = Invoice::where('contract_id', $contract->id)->where('remain_amount', '>', 0)->exists();
        if ($hasUnpaidInvoice) {
            return response()->json([
                'message'
                => 'Khách thuê còn hóa đơn chưa thanh toán. Không thể thanh lý hợp đồng.'
            ], 400);
        }

        if ((float)$validated['returned_deposit'] > (float)$contract->deposit) {
            return response()->json([
                'message' => 'Tiền cọc hoàn trả không được lớn hơn tiền cọc ban đầu.'
            ], 422);
        }

        try {
            DB::transaction(function () use ($contract, $validated) {

                $contract->update([
                    'status' => 1,
                    'actual_end_date' => $validated['actual_end_date'],
                    'returned_deposit' => $validated['returned_deposit']
                ]);

                $room = Room::find($contract->room_id);
                if ($room) {
                    $room->update(['status' => 0]);
                }
                $tenant = Tenant::find($contract->tenant_id);
                if ($tenant) {
                    $tenant->update(['status' => 2]);
                }
            });
            return response()->json(['message' => 'Thanh lý hợp đồng và hoàn tất trả phòng thành công.'], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Không thể thanh lý hợp đồng này.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
