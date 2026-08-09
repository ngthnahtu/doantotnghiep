<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Notification_User;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if ($user->role === 0) {
            $query = Payment::with('invoices.contracts.tenants', 'invoices.rooms');
        } else {
            $tenant = $user->tenants;
            if (!$tenant) {
                return response()->json(['message' => 'Không tìm thấy hồ sơ khách thuê.'], 404);
            }
            $query = Payment::with('invoices.contracts.tenants', 'invoices.rooms')->whereHas('invoices.contracts', function ($query) use ($tenant) {
                $query->where('tenant_id', $tenant->id);
            });
        }

        $search = trim($request->search ?? '');
        $filter = trim($request->filter ?? '');

        $query->when($search !== '', function ($query) use ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_code', 'like', "%{$search}%")
                    ->orWhere('payment_date', 'like', "%{$search}%")
                    ->orWhere('approved_at', 'like', "%{$search}%")
                    ->orWhereHas('invoices.contracts.tenants', function ($qu) use ($search) {
                        $qu->where('phone', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        });
        $query->when($filter!=='', function($qu)use($filter){
            $qu->where('status',$filter);
        });
        
        $payments = $query->orderBy('created_at', 'desc')->paginate(8);

        return response()->json([
            'message' => 'Tải danh sách thông tin thanh toán thành công',
            'data' => $payments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'message' => 'Bạn chưa đăng nhập.'
            ], 401);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|integer|in:0,1',
            'proof_image' => 'required_if:payment_method,1|nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'note' => 'nullable|string|max:191',
            'invoice_id' => 'required|integer|exists:invoices,id'
        ], [
            'amount.required' => 'Số tiền thanh toán không được để trống.',
            'amount.numeric' => 'Số tiền thanh toán phải là số.',
            'amount.min' => 'Số tiền thanh toán phải lớn hơn 0.',
            'payment_method.required' => 'Vui lòng chọn phương thức thanh toán.'
        ]);
        try {

            $isAdmin = (int)$user->role === 0;
            $isCash = (int)$validated['payment_method'] === 0;

            if (!$isAdmin && $isCash) {
                return response()->json([
                    'message' => 'Thanh toán tiền mặt phải được chủ nhà ghi nhận.'
                ], 422);
            }

            $isAdminCashPayment = $isAdmin && $isCash;

            $payment = DB::transaction(function () use ($validated, $request, $user, $isAdminCashPayment) {
                $invoice = Invoice::with('contracts')->where('id', $validated['invoice_id'])->lockForUpdate()->first();
                if (!$invoice) {
                    throw new \Exception('Không tìm thấy hóa đơn này.');
                }

                if ((int) $user->role === 1) {
                    $tenant = $user->tenants;
                    if (!$tenant || !$invoice->contracts || (int) $invoice->contracts->tenant_id !== (int) $tenant->id) {
                        throw new \Exception('Bạn không có quyền thực hiện thanh toán cho hóa đơn này.');
                    }
                }

                $hasPayment = Payment::where('invoice_id', $invoice->id)->where('status', 0)->exists();
                if ($hasPayment) {
                    throw new \Exception('Hóa đơn này đang có giao dịch chờ duyệt.');
                }
                if ((float) $invoice->remain_amount <= 0) {
                    throw new \Exception('Hóa đơn này không còn số tiền cần thanh toán.');
                }
                if ((int) $invoice->status === 3) {
                    throw new \Exception('Hóa đơn này đã hoàn tất đóng tiền, không thể tạo thêm giao dịch.');
                }
                if ((float) $validated['amount'] > (float) $invoice->remain_amount) {
                    throw new \Exception('Số tiền thanh toán vượt quá số tiền còn nợ thực tế của hóa đơn.');
                }

                $paymentDate = Carbon::now();

                if ($request->hasFile('proof_image')) {
                    $validated['proof_image'] = $request->file('proof_image')->store('payments', 'public');
                }

                $payment = Payment::create([
                    'payment_code' => 'Temp-' . Str::random(10),
                    'amount' => $validated['amount'],
                    'payment_method' => $validated['payment_method'],
                    'proof_image' => $validated['proof_image'] ?? null,
                    'status' => $isAdminCashPayment ? 1 : 0,
                    'note' => $validated['note'] ?? null,
                    'payment_date' => $paymentDate,
                    'approved_at' => $isAdminCashPayment ? $paymentDate : null,
                    'invoice_id' => $invoice->id,
                ]);

                $paymentCode = 'TT-' . date('Ymd') . str_pad($payment->id, 5, '0', STR_PAD_LEFT);
                $payment->update([
                    'payment_code' => $paymentCode
                ]);

                if ($isAdminCashPayment) {
                    $paidAmount = (float)$invoice->paid_amount + (float)$validated['amount'];
                    $remainAmount = (float)$invoice->total_amount - $paidAmount;

                    if ($remainAmount < 0) {
                        throw new \Exception('Số tiền thanh toán vượt quá số tiền còn nợ.');
                    }

                    $invoice->update([
                        'paid_amount' => $paidAmount,
                        'remain_amount' => $remainAmount,
                        'status' => $remainAmount <= 0 ? 3 : 2,
                    ]);
                } else {
                    $invoice->update([
                        'status' => 1,
                    ]);
                }

                return $payment;
            });

            return response()->json([
                'message' => $isAdminCashPayment ? "Thanh toán thành công."
                    : 'Thêm thông tin thanh toán thành công, vui lòng chờ chủ nhà phê duyệt.',
                'data' => $payment
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Thanh toán không thành công.',
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
        $payment = Payment::with('invoices')->find($id);
        if (!$payment) {
            return response()->json([
                'message' => 'Không tìm thấy thông tin thanh toán này.'
            ], 404);
        }
        if ($user->role === 1) {
            $tenant = $user->tenants;
            if (!$tenant || !$payment->invoices || !$payment->invoices->contracts || $payment->invoices->contracts->tenant_id !== $tenant->id) {
                return response()->json(['message' => 'Bạn không có quyền truy cập dữ liệu thanh toán này.'], 403);
            }
        }
        return response()->json([
            'message' => 'Lấy thông tin thanh toán chi tiết thành công.',
            'data' => $payment
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        if (!$user || (int)$user->role !== 0) {
            return response()->json(['message' => 'Chỉ có Quản trị viên mới được quyền phê duyệt thanh toán.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|integer|in:1,2',
            'note' => 'nullable|string|max:191'
        ], [
            'status.required' => 'Vui lòng cập nhật trạng thái phê duyệt.',
            'status.in' => 'Trạng thái phê duyệt không hợp lệ.'
        ]);

        try {
            $payment = DB::transaction(function () use ($id, $validated) {

                $payment = Payment::where('id', $id)->lockForUpdate()->first();

                if (!$payment) {
                    throw new \Exception('Không tìm thấy thông tin thanh toán này.');
                }

                if ((int) $payment->status !== 0) {
                    throw new \Exception('Giao dịch này đã được xử lý trước đó, không thể chỉnh sửa.');
                }

                $invoice = Invoice::with('contracts.tenants')->where('id', $payment->invoice_id)->lockForUpdate()->first();
                if (!$invoice) {
                    throw new \Exception('Không tìm thấy hóa đơn của giao dịch này.');
                }

                if ((int)$validated['status'] === 1) {
                    if ($invoice->remain_amount <= 0) {
                        throw new \Exception('Hóa đơn này đã được thanh toán đầy đủ.');
                    }
                    if ($payment->amount > $invoice->remain_amount) {
                        throw new \Exception('Số tiền giao dịch vượt quá số tiền hóa đơn còn nợ.');
                    }

                    $paidAmount =(float) $invoice->paid_amount + (float) $payment->amount;
                    $remainAmount = (float) $invoice->total_amount - $paidAmount;
                    
                    if ($remainAmount < 0) {
                        throw new \Exception('Số tiền giao dịch vượt quá số tiền hóa đơn còn nợ.');
                    }

                    $invoiceStatus = $remainAmount <= 0 ? 3 : 2;

                    $invoice->update([
                        'paid_amount' => $paidAmount,
                        'remain_amount' => $remainAmount,
                        'status' => $invoiceStatus
                    ]);
                } else {
                    $invoiceStatus =(float) $invoice->remain_amount <= 0 ? 3
                        : ( (float) $invoice->paid_amount > 0 ? 2 : 0);

                    $invoice->update([
                        'status' => $invoiceStatus
                    ]);
                }

                $payment->update([
                    'status' => $validated['status'],
                    'note' => $validated['note'] ?? $payment->note,
                    'approved_at' => $validated['status'] == 1 ? Carbon::now() : null
                ]);

                $contract = $invoice->contracts;
                if ($contract && $contract->tenants && $contract->tenants->user_id) {
                    $statusText = $validated['status'] == 1 ? 'ĐÃ ĐƯỢC PHÊ DUYỆT' : 'BỊ TỪ CHỐI';
                    $reasonText = $validated['status'] == 2 && !empty($validated['note']) ? " Lý do: " . $validated['note'] : "";

                    $notification = Notification::create([
                        'title' => 'Kết quả phê duyệt thanh toán mã ' . $payment->payment_code,
                        'content' => "Giao dịch đóng số tiền " . number_format($payment->amount) . "đ cho hóa đơn tháng này của bạn " . $statusText . "." . $reasonText,
                        'type' => 3,
                        'target_type' => false
                    ]);

                    Notification_User::create([
                        'notification_id' => $notification->id,
                        'user_id' => $contract->tenants->user_id
                    ]);
                }
                return $payment;
            });

            return response()->json([
                'message' => $validated['status'] == 1 ? 'Phê duyệt thanh toán hóa đơn thành công.' : 'Đã từ chối duyệt giao dịch thanh toán này.',
                'data' => $payment
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Xử lý phê duyệt thất bại.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // if (Auth::user()->role !== 0) {
        //     return response()->json(['message' => 'Hành động không được phép.'], 403);
        // }

        // $payment = Payment::find($id);
        // if (!$payment) {
        //     return response()->json(['message' => 'Không tìm thấy thông tin thanh toán này.'], 404);
        // }

        // if ($payment->status === 1) {
        //     return response()->json([
        //         'message' => 'Không thể xóa giao dịch thanh toán đã được phê duyệt thành công.'
        //     ], 422);
        // }
        // if ($payment->proof_image) {
        //     Storage::disk('public')->delete($payment->proof_image);
        // }
        // $payment->delete();

        // return response()->json([
        //     'message' => 'Xóa thông tin giao dịch lỗi/hủy thành công.'
        // ], 200);
    }
}
