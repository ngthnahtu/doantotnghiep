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
    public function index()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Không tìm thấy người dùng này.'], 403);
        }

        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant) {
                return response()->json([
                    'message' => 'Không tìm thấy thông tin khách thuê này.'
                ], 404);
            }

            $contractID = $tenant->contracts()->pluck('id');
            $invoices = Invoice::whereIn('contract_id', $contractID)->orderBy('created_at', 'desc')->paginate(8);
        } else {
            $invoices = Invoice::with('rooms','contracts.tenants','invoice_details.services')
            ->orderBy('status', 'asc')->paginate(8);
        }
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

        $currentMonth=now()->format('Y-m');
        if($validated['bill_month'] < $currentMonth){
            return response()->json([
                'message' => 'Không thể lập hóa đơn cho tháng trước.'
            ], 422);
        }

        $billMonth = $request->bill_month;

        $contracts = Contract::with('rooms', 'contract_services.services', 'room_members')->where('status', 0)->get();
        $data = [];

        foreach ($contracts as $contract) {
            $isExist = Invoice::where('contract_id', $contract->id)->where('bill_month', $validated['bill_month'])->exists();
            if ($isExist) continue;

            $memberCount = 1;
            if ($contract->room_members) $memberCount += $contract->room_members->count();

            $serviceData = [];
            $contractServices= $contract->contract_services->sortBy('service_id');
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
                'deposit' => $contract->deposit,
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
        if (!$user || $user->role !== 0) {
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
            'due_date.after_or_equal'=> 'Hạn đóng tiền phải từ hôm nay trở đi.',
            'data.required' => 'Danh sách dữ liệu phòng tính tiền không được rỗng.'
        ]);

        try {
            $invoices = DB::transaction(function () use ($validated) {

                $billMonth = $validated['bill_month'];
                $dueDate = $validated['due_date'];
                $listInvoice = [];
                foreach ($validated['data'] as $data) {
                    //tại vì fe gửi lên data.*.contract_id nên $data['contract_id']
                    $contract = Contract::with('rooms', 'room_members')->find($data['contract_id']);

                    if (!$contract || $contract->status !== 0) {
                        throw new \Exception('Hợp đồng không còn hiệu lực.');
                    }

                    if ($contract->room_id != $data['room_id']) {
                        throw new \Exception('Hợp đồng không thuộc phòng này.');
                    }

                    $isExist = Invoice::where('contract_id', $data['contract_id'])->where('bill_month', $billMonth)->exists();
                    if ($isExist) continue;

                    $roomPriceSnap = $contract->rent_price;
                    $totalServices = 0;
                    $invoiceDetail = [];

                    $memberCount = 1;
                    if ($contract->room_members)  $memberCount += $contract->room_members->count();

                    foreach ($data['services'] as $service) {

                        $contractService=Contract_Service::with('services')->where('service_id',$service['service_id'])
                        ->where('contract_id',$contract->id)->first();

                        if(!$contractService){
                            throw new \Exception('Dịch vụ không thuộc hợp đồng này.');
                        }

                        $servicesObject= $contractService->services;
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
                                'current_index'=>$newIndex
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

                    $invoiceCode = 'HD-' . date('Ym', strtotime($billMonth)) . "-" . str_pad($invoice->id, 4, 0, STR_PAD_LEFT);
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
                            'type' => 1,
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
                'total_issued' => count($invoices) // Trả về số lượng hóa đơn chính xác
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Có lỗi xảy ra. Vui lòng thử lại',
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

        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json([
                'message' => 'Không tìm thấy hóa đơn này.'
            ], 404);
        }

        if($invoice->paid_amount > 0){
            return response()->json([
                'message' => 'Không thể sửa hóa đơn đã thanh toán'
            ], 400);
        }

        $hasLaterInvoice=Invoice::where('contract_id',$invoice->contract_id)->where('bill_month','>',$invoice->bill_month)->exists();
        if($hasLaterInvoice){
            return response()->json([
                'message' => 'Không thể sửa vì đã có hóa đơn của tháng tiếp theo.'
            ], 400);
        }
        
        $validated = $request->validate([
            'note' => 'nullable|string|max:191',
            'services' => 'required|array|min:1',
            'services.*.service_id' => 'required|integer|distinct|exists:services,id',
            'services.*.new_index' => 'nullable|integer|min:0',
        ]);
        try {

            DB::transaction(function () use ($invoice, $validated) {
                $totalServicecs = 0;
                foreach ($validated['services'] as $service) {

                    $newIndex = $service['new_index'] ?? null;

                    $memberCount = 1;
                    $memberCount += $invoice->contracts->room_members->count();
                    $total = 0;

                    //2 whwere vì nếu chỉ có cái invoice thì lúc nào nó cũng lấy dòng đầu tiên của invoices
                    $invoiceDetail = Invoice_Detail::where('invoice_id', $invoice->id)
                        ->where('service_id', $service['service_id'])->first();

                    if (!$invoiceDetail) {
                        throw new \Exception('Không tìm thấy hóa đơn chi tiết.');
                    }

                    $oldIndex=$invoiceDetail->old_index;

                    if ($invoiceDetail->services->charge_type === 0) {
                        $total = $invoiceDetail->unit_price_snapshot;
                    }

                    if ((int) $invoiceDetail->services->charge_type === 1) {
                        if ($oldIndex === null || $newIndex === null) {
                            throw new \Exception('Vui lòng nhập đầy đủ chỉ số cũ và chỉ số mới.');
                        }

                        if ($oldIndex > $newIndex) {
                            throw new \Exception('Chỉ số mới không được nhỏ hơn chỉ số cũ.');
                        }
                        
                        $total = ($newIndex - $oldIndex) * $invoiceDetail->unit_price_snapshot;
                    }

                    if ($invoiceDetail->services->charge_type === 2) {
                        $total = $memberCount * $invoiceDetail->unit_price_snapshot;
                    }

                    $totalServicecs += $total;

                    $invoiceDetail->update([
                        'old_index' => $oldIndex,
                        'new_index' => $newIndex,
                        'subtotal' => $total
                    ]);

                    //phải có where contracts vì nếu nhiều hợp đồng cùng dùng điện thì sẽ lấy nhầm.

                    if ((int) $invoiceDetail->services->charge_type === 1) {
                        $contractService = Contract_Service::where(
                            'service_id',
                            $service['service_id']
                        )->where('contract_id', $invoice->contract_id)->first();

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
                    'type' => 0,
                    'target_type' => false
                ]);

                $tenant = $invoice->contracts->tenants;
                if ($tenant && $tenant->user_id) {
                    Notification_User::create([
                        'notification_id' => $noti->id,
                        'user_id' => $tenant->user_id,
                    ]);
                }
            });
            return response()->json([
                'message' => 'Cập nhật hóa đơn ' . $invoice->invoice_code . ' thành công.',
                'data' => $invoice->load(['invoice_details', 'contracts.contract_services'])
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Có lỗi xảy ra khi cố sửa hóa đơn này.',
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
        if ($user->role !== 0) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập nội dung này.'
            ], 403);
        }

        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json([
                'message' => 'Không tìm thấy hóa đơn này.'
            ], 404);
        }
        if ($invoice->status !== 0) {
            return response()->json([
                'message' => 'Hóa đơn này không thể xóa. Chỉ có thể xóa khi ở trạng thái chờ thanh toán.'
            ], 400);
        }

        try {

            DB::transaction(function () use ($invoice) {
                $invoice->invoice_details()->delete();
                $invoice->payments()->delete();
                $invoice->delete();
            });
            return response()->json(['message' => 'Xóa hóa đơn chưa thanh toán thành công.'], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Không thể xóa hóa đơn này.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
