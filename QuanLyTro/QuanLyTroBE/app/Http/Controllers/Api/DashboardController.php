<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Issue;
use App\Models\Payment;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
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
        $totalRoom = Room::count();
        $rentRoom = Room::where('status', 1)->count();
        $emptyRoom = Room::where('status', 0)->count();
        $roomRate = $totalRoom > 0 ? round(($rentRoom / $totalRoom) * 100, 1): 0;

        $revenueMonth = Payment::where('status', 1)->whereMonth('approved_at', now()->month)
            ->whereYear('approved_at', now()->year)->sum('amount');

        $invoiceRecent = Invoice::with('rooms')->orderBy('created_at', 'desc')->limit(3)->get();
        $issueRecent = Issue::with(['rooms', 'tenants'])->orderBy('created_at', 'desc')->limit(3)->get();

        return response()->json([
            'message' => 'Thống kê thành công.',
            'data' => [
                'total_room' => $totalRoom,
                'rent_room' => $rentRoom,
                'empty_room' => $emptyRoom,
                'room_rate' => $roomRate,
                'total_tenants' => Tenant::where('status', 1)->count(),
                'revenue_month' => $revenueMonth,
                'unpaid_invoices' => Invoice::whereIn('status', [0, 2])->count(),
                'open_issues' => Issue::whereIn('status', [0, 1])->count(),
                'invoice_recent' => $invoiceRecent,
                'issue_recent' => $issueRecent,
            ],
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
