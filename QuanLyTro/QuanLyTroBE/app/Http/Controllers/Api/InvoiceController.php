<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Contract_Service;
use App\Models\Invoice;
use App\Models\Invoice_Detail;
use App\Models\Notification;
use App\Models\Notification_User;
use Illuminate\Database\Eloquent\Attributes\DateFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Throwable;

use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng này.'], 403);
        }

        Invoice::whereIn('status', [0, 2])->where('remain_amount', '>', 0)->whereDate('due_date', '<', today())
            ->update([
                'status' => 4
            ]);

        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant) {
                return response()->json([
                    'message' => 'Không tìm thấy thông tin khách thuê này.'
                ], 404);
            }

            $contractID = $tenant->contracts()->pluck('id');
            $query = Invoice::whereIn('contract_id', $contractID);
        } else {
            $query = Invoice::query();
        }

        $search = trim($request->search ?? '');
        $filter = trim($request->filter ?? '');

        $query->when($search !== '', function ($query) use ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_code', 'like', "%{$search}%")
                    ->orWhere('bill_month', 'like', "%{$search}%")
                    ->orWhereHas('rooms', function ($qu) use ($search) {
                        $qu->where('room_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('contracts.tenants', function ($que) use ($search) {
                        $que->where('phone', 'like', "%{$search}%");
                    });
            });
        });

        $query->when($filter !== '', function ($qu) use ($filter) {
            $qu->where('status', $filter);
        });

        $invoices = $query->with('rooms', 'contracts.tenants', 'invoice_details.services')
            ->orderBy('created_at', 'desc')->paginate(8);
        return response()->json([
            'message' => 'Tải danh sách hóa đơn thành công.',
            'data' => $invoices
        ], 200);
    }

    public function prepare(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập.',
            ], 403);
        }
        $validated = $request->validate([
            'bill_month' => 'required|date_format:Y-m'
        ]);

        $billMonth = $validated['bill_month'];

        $contracts = Contract::with('rooms', 'contract_services.services', 'room_members')->where('status', 0)->get();
        $data = [];

        foreach ($contracts as $contract) {

            $startMonth = $contract->start_date->format('Y-m');
            $endMonth = $contract->end_date->format('Y-m');

            if ($billMonth < $startMonth || $billMonth > $endMonth) {
                continue;
            }

            $hasInvoice = Invoice::where('contract_id', $contract->id)->where('bill_month', '>=', $billMonth)->exists();

            if ($hasInvoice) {
                continue;
            }

            $memberCount = 1;
            if ($contract->room_members) $memberCount += $contract->room_members->count();

            $serviceData = [];
            $contractServices = $contract->contract_services->sortBy('service_id');

            foreach ($contractServices as $contractService) {
                $serviceData[] = [
                    'service_id' => $contractService->service_id,
                    'service_name' => $contractService->services->name,
                    'old_index' => $contractService->current_index,
                    'charge_type' => $contractService->services->charge_type,
                    'unit_price' => $contractService->services->price,
                ];
            }
            $data[] = [
                'contract_id' => $contract->id,
                'room_id' => $contract->rooms->id,
                'room_name' => $contract->rooms->room_name,
                'room_price' => $contract->rent_price,
                'member_count' => $memberCount,
                'services' => $serviceData
            ];
        }
        return response()->json([
            'message' => 'Tải dữ liệu thành công.',
            'bill_month' => $billMonth,
            'data' => $data
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || (int)$user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }

        $validated = $request->validate([
            'bill_month' => 'required|date_format:Y-m',
            'due_date' => 'required|date|after_or_equal:today',
            'note' => 'nullable|string|max:191',
            'data' => 'required|array|min:1',
            'data.*.contract_id' => 'required|integer|exists:contracts,id',
            'data.*.room_id' => 'required|integer|exists:rooms,id',
            'data.*.services' => 'required|array|min:1',
            'data.*.services.*.service_id' => 'required|integer|exists:services,id',
            'data.*.services.*.new_index' => 'nullable|integer|min:0'
        ], [
            'bill_month.required' => 'Tháng tính hóa đơn không được bỏ trống.',
            'due_date.required' => 'Hạn đóng tiền không được bỏ trống.',
            'due_date.after_or_equal' => 'Hạn đóng tiền phải từ hôm nay trở đi.',
            'data.required' => 'Danh sách dữ liệu phòng tính tiền không được rỗng.'
        ]);

        try {
            $invoices = DB::transaction(function () use ($validated) {

                $billMonth = $validated['bill_month'];
                $dueDate = $validated['due_date'];
                $listInvoice = [];
                foreach ($validated['data'] as $data) {

                    $contract = Contract::with('rooms', 'room_members', 'tenants')->where('id', $data['contract_id'])
                        ->lockForUpdate()->first();

                    if (!$contract || (int)$contract->status !== 0) {
                        throw new \Exception('Hợp đồng không còn hiệu lực.');
                    }

                    if ($contract->room_id != $data['room_id']) {
                        throw new \Exception('Hợp đồng không thuộc phòng này.');
                    }

                    $startMonth = $contract->start_date->format('Y-m');
                    $endMonth = $contract->end_date->format('Y-m');

                    if ($billMonth < $startMonth || $billMonth > $endMonth) {
                        throw new \Exception(
                            'Tháng hóa đơn không nằm trong thời hạn hợp đồng.'
                        );
                    }

                    $hasLaterInvoice = Invoice::where('contract_id', $contract->id)->where('bill_month', '>', $billMonth)->exists();
                    if ($hasLaterInvoice) {
                        throw new \Exception(
                            'Không thể lập hóa đơn tháng cũ vì hợp đồng đã có hóa đơn tháng sau.'
                        );
                    }

                    $isExist = Invoice::where('contract_id', $contract->id)->where('bill_month', $billMonth)->exists();
                    if ($isExist) continue;

                    $roomPriceSnap = $contract->rent_price;
                    $totalServices = 0;
                    $invoiceDetail = [];

                    $memberCount = 1;
                    if ($contract->room_members)  $memberCount += $contract->room_members->count();

                    //values de danh so key lai  0123, collect de rq thanh collection vd {service_id : 1} de co the pluck
                    $contractServiceID = Contract_Service::where('contract_id', $contract->id)->pluck('service_id')->sort()->values();
                    $requestServiceID = collect($data['services'])->pluck('service_id')->sort()->values();

                    if ($contractServiceID->toArray() !== $requestServiceID->toArray()) {
                        throw new \Exception('Danh sách dịch vụ không khớp với hợp đồng.');
                    }

                    foreach ($data['services'] as $service) {

                        $contractService = Contract_Service::with('services')->where('service_id', $service['service_id'])
                            ->where('contract_id', $contract->id)->first();

                        if (!$contractService) {
                            throw new \Exception('Dịch vụ không thuộc hợp đồng này.');
                        }

                        $servicesObject = $contractService->services;
                        $oldIndex = $contractService->current_index;
                        $newIndex = $service['new_index'] ?? null;

                        $unitPrice = $servicesObject->price; //lấy giá gốc từ bảng services
                        $subtotal = 0;
                        $chargeType = (int)$servicesObject->charge_type;

                        if ($chargeType === 0) {
                            $subtotal = $unitPrice;
                        }
                        if ($chargeType === 1) {
                            if ($oldIndex === null || $newIndex === null) {
                                throw new \Exception("Vui lòng nhập đầy đủ chỉ số dịch vụ tại phòng " . $contract->rooms->room_name . ".");
                            }
                            if ($oldIndex > $newIndex) {
                                throw new \Exception("Có lỗi xảy ra tại phòng " . $contract->rooms->room_name . ". Vui lòng thử lại.");
                            }
                            $subtotal = ($newIndex - $oldIndex) * $unitPrice;
                        }
                        if ($chargeType === 2) {
                            $subtotal = $memberCount * $unitPrice;
                        }
                        $totalServices += $subtotal;

                        $invoiceDetail[] = [
                            'service_id' => $servicesObject->id,
                            'service_name_snapshot' => $servicesObject->name,
                            'old_index' => $oldIndex,
                            'new_index' => $newIndex,
                            'unit_price_snapshot' => $unitPrice,
                            'subtotal' => $subtotal
                        ];

                        if ($chargeType === 1 && $newIndex !== null) {
                            $contractService->update([
                                'current_index' => $newIndex
                            ]);
                        }
                    }

                    $totalAmount = $roomPriceSnap + $totalServices;

                    $invoice = Invoice::create([
                        'invoice_code' => 'TEMP-' . Str::random(10),
                        'bill_month' => $billMonth,
                        'room_price_snapshot' => $roomPriceSnap,
                        'total_amount' => $totalAmount,
                        'paid_amount' => 0,
                        'remain_amount' => $totalAmount,
                        'due_date' => $dueDate,
                        'note' => $validated['note'] ?? null,
                        'room_id' => $contract->room_id,
                        'contract_id' => $contract->id
                    ]);

                    $invoiceCode = 'HD-' . date('Ym', strtotime($billMonth)) . "-" . str_pad($invoice->id, 6, 0, STR_PAD_LEFT);
                    $invoice->update([
                        'invoice_code' => $invoiceCode
                    ]);

                    foreach ($invoiceDetail as $detail) {
                        $invoiceDetails = Invoice_Detail::create([
                            'service_name_snapshot' => $detail['service_name_snapshot'],
                            'old_index' => $detail['old_index'],
                            'new_index' => $detail['new_index'],
                            'unit_price_snapshot' => $detail['unit_price_snapshot'],
                            'subtotal' => $detail['subtotal'],
                            'invoice_id' => $invoice->id,
                            'service_id' => $detail['service_id']
                        ]);
                    }

                    if ($contract->tenants && $contract->tenants->user_id) {
                        $noti = Notification::create([
                            'title' => 'Hóa đơn tiền nhà tháng ' . date('m/Y', strtotime($billMonth)),
                            'content' => 'Hóa đơn số ' . $invoice->invoice_code . '. Vui lòng thanh toán trước ngày ' . date('d/m/Y', strtotime($dueDate)) .
                                ' Mọi thắc mắc vui lòng liên hệ chủ nhà !',
                            'type' => 2,
                            'target_type' => 0
                        ]);
                        $notiUser = Notification_User::create([
                            'notification_id' => $noti->id,
                            'user_id' => $contract->tenants->user_id,
                        ]);
                    }
                    $listInvoice[] = $invoice;
                }
                return $listInvoice;
            });
            return response()->json([
                'message' => 'Phát hành hóa đơn hàng loạt thành công.',
                'total_issued' => count($invoices)
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Có lỗi xảy ra. Vui lòng thử lại',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'message' => 'Không tìm thấy tài khoản này.'
            ], 403);
        }
        $invoice = Invoice::with('rooms', 'invoice_details')->find($id);
        if (!$invoice) {
            return response()->json([
                'message' => 'Không tìm thấy hóa đơn này.'
            ], 404);
        }

        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant) {
                return response()->json([
                    'message' => 'Không tìm thấy thông tin khách thuê này.'
                ], 404);
            }
            $contract = Contract::where('tenant_id', $tenant->id)->where('id', $invoice->contract_id)->exists();
            if (!$contract) {
                return response()->json(['message' => 'Bạn không có quyền xem hóa đơn này.'], 403);
            }
        }
        return response()->json([
            'message' => 'Tải chi tiết hóa đơn thành công',
            'data' => $invoice
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

        $validated = $request->validate([
            'note' => 'nullable|string|max:191',
            'services' => 'required|array|min:1',
            'services.*.service_id' => 'required|integer|distinct|exists:services,id',
            'services.*.new_index' => 'nullable|integer|min:0',
        ]);
        try {
            $invoice = DB::transaction(function () use ($id, $validated) {

                $invoice = Invoice::where('id', $id)->lockForUpdate()->first();
                
                if (!$invoice) {
                    throw new \Exception("Không tìm thấy hóa đơn này.");
                }

                $hasPayment = $invoice->payments()->whereIn('status', [0, 1])->exists();

                if ((int) $invoice->status !== 0 || $hasPayment) {
                    throw new \Exception("Không thể sửa hóa đơn đã phát sinh thanh toán hoặc đang chờ duyệt.");
                }

                $hasLaterInvoice = Invoice::where('contract_id', $invoice->contract_id)
                    ->where('bill_month', '>', $invoice->bill_month)->exists();
                if ($hasLaterInvoice) {
                    throw new \Exception("Không thể sửa vì đã có hóa đơn của tháng tiếp theo.");
                }

                $invoiceServiceID = Invoice_Detail::where('invoice_id', $invoice->id)->pluck('service_id')->sort()->values();
                $requestServiceID = collect($validated['services'])->pluck('service_id')->sort()->values();
                if ($invoiceServiceID->toArray() !== $requestServiceID->toArray()) {
                    throw new \Exception('Danh sách dịch vụ không khớp với hóa đơn.');
                }

                $totalServicecs = 0;
                foreach ($validated['services'] as $service) {

                    $newIndex = $service['new_index'] ?? null;
                    $total = 0;

                    $invoiceDetail = Invoice_Detail::where('invoice_id', $invoice->id)->where('service_id', $service['service_id'])->first();
                    if (!$invoiceDetail) {
                        throw new \Exception('Không tìm thấy hóa đơn chi tiết.');
                    }

                    $chargeType = (int) $invoiceDetail->services->charge_type;
                    $oldIndex = $invoiceDetail->old_index;

                    if ($chargeType === 0) {
                        $total = $invoiceDetail->unit_price_snapshot;
                    }

                    if ($chargeType === 1) {
                        if ($oldIndex === null || $newIndex === null) {
                            throw new \Exception('Vui lòng nhập đầy đủ chỉ số cũ và chỉ số mới.');
                        }

                        if ($oldIndex > $newIndex) {
                            throw new \Exception('Chỉ số mới không được nhỏ hơn chỉ số cũ.');
                        }

                        $total = ($newIndex - $oldIndex) * $invoiceDetail->unit_price_snapshot;
                    }

                    if ($chargeType === 2) {
                        $total = $invoiceDetail->subtotal;
                    }

                    $totalServicecs += $total;

                    $invoiceDetail->update([
                        'old_index' => $oldIndex,
                        'new_index' => $newIndex,
                        'subtotal' => $total
                    ]);

                    if ($chargeType === 1) {
                        $contractService = Contract_Service::where('service_id', $service['service_id'])
                            ->where('contract_id', $invoice->contract_id)->first();

                        if ($contractService) {
                            $contractService->update([
                                'current_index' => $newIndex
                            ]);
                        }
                    }
                }

                $totalAmount = $totalServicecs + $invoice->room_price_snapshot;
                $remainAmount = $totalAmount - $invoice->paid_amount;

                $status = $invoice->status;
                if ($remainAmount <= 0) {
                    $status = 3;
                } elseif ($invoice->paid_amount > 0 && $invoice->paid_amount < $totalAmount) {
                    $status = 2;
                } else {
                    $status = 0;
                }

                $invoice->update([
                    'total_amount' => $totalAmount,
                    'remain_amount' => $remainAmount,
                    'note' => $validated['note'] ?? $invoice->note,
                    'status' => $status
                ]);

                $noti = Notification::create([
                    'title' => 'Cập nhật hóa đơn số ' . $invoice->invoice_code,
                    'content' => 'Vui lòng kiểm tra lại hóa đơn chi tiết.',
                    'type' => 2,
                    'target_type' => false
                ]);

                $tenant = $invoice->contracts->tenants;
                if ($tenant && $tenant->user_id) {
                    Notification_User::create([
                        'notification_id' => $noti->id,
                        'user_id' => $tenant->user_id,
                    ]);
                }
                return $invoice;
            });
            return response()->json([
                'message' => 'Cập nhật hóa đơn ' . $invoice->invoice_code . ' thành công.',
                'data' => $invoice->load(['invoice_details', 'contracts.contract_services'])
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Có lỗi xảy ra khi cố sửa hóa đơn này.',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        if ($user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập nội dung này.'
            ], 403);
        }

        try {
            DB::transaction(function () use ($id) {
                $invoice = Invoice::with('invoice_details')->where('id', $id)->lockForUpdate()->first();

                if (!$invoice) {
                    throw new \Exception("Không tìm thấy hóa đơn này.");
                }

                if ($invoice->status !== 0) {
                    throw new \Exception("Hóa đơn này không thể xóa. Chỉ có thể xóa khi ở trạng thái chờ thanh toán.");
                }

                if ($invoice->payments()->exists()) {
                    throw new \Exception("Không thể xóa hóa đơn đã phát sinh lịch sử thanh toán.");
                }

                $hasLaterInvoice = Invoice::where('contract_id', $invoice->contract_id)
                    ->where('bill_month', '>', $invoice->bill_month)->exists();
                if ($hasLaterInvoice) {
                    throw new \Exception("Không thể xóa hóa đơn vì hợp đồng đã có hóa đơn của tháng sau.");
                }
                foreach ($invoice->invoice_details as $detail) {
                    if ($detail->service_id !== null && $detail->old_index !== null && $detail->new_index !== null) {
                        Contract_Service::where('contract_id', $invoice->contract_id)
                            ->where('service_id', $detail->service_id)->update([
                                'current_index' => $detail->old_index,
                            ]);
                    }
                }

                $invoice->invoice_details()->delete();
                $invoice->delete();
            });
            return response()->json(['message' => 'Xóa hóa đơn chưa thanh toán thành công.'], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' =>  $e->getMessage()
            ], 422);
        }
    }
}
