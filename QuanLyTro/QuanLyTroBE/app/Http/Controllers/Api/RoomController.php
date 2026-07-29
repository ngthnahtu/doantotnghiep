<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class RoomController extends Controller
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
        $rooms = Room::orderBy('id', 'asc')->paginate(8);
        return response()->json([
            'message' => 'Tải danh sách phòng thành công.',
            'data' => $rooms
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
            'room_name' => 'required|string|max:191',
            'floor' => 'nullable|integer|min:0',
            'base_price' => 'nullable|numeric|min:0',
            'area' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'description' => 'nullable|string',
            'status'=>'nullable'
        ], [
            'room_name.required' => 'Tên phòng không được để trống.',
            'floor.integer'      => 'Số tầng phải là số nguyên.',
            'base_price.numeric'  => 'Giá phòng bắt buộc phải là số.',
            'base_price.min'      => 'Giá phòng không được là số âm.',
            'area.numeric'       => 'Diện tích bắt buộc phải là số.',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('rooms', 'public');
        }

        $room = Room::create($validated);
        return response()->json([
            'message' => "Thêm phòng {$room->room_name} mới thành công.",
            'data' => $room
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
        $room = Room::find($id);
        if (!$room) {
            return response()->json([
                'message' => 'Không tìm thấy phòng này'
            ], 404);
        }
        return response()->json([
            'message' => "Lấy thông tin chi tiết phòng {$room->room_name} thành công",
            'data' => $room
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
        $room = Room::find($id);
        if (!$room) {
            return response()->json([
                'message' => 'Không tìm thấy phòng này'
            ], 404);
        }
        $validated = $request->validate(
            [
                'room_name' => 'required|string|max:191',
                'floor' => 'nullable|integer|min:0',
                'base_price' => 'nullable|numeric|min:0',
                'area' => 'nullable|numeric|min:0',
                'status' => 'required|integer',
                'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
                'description' => 'nullable|string',
            ],
            [
                'room_name.required' => 'Tên phòng không được để trống.',
                'floor.integer'      => 'Số tầng phải là số nguyên.',
                'base_price.numeric'  => 'Giá phòng bắt buộc phải là số.',
                'base_price.min'      => 'Giá phòng không được là số âm.',
                'area.numeric'       => 'Diện tích bắt buộc phải là số.',
                'status.required'    => 'Trạng thái phòng không được để trống.',
            ]
        );
        $hasContract = $room->contracts()->where('status', 0)->exists();
        if ($hasContract && $validated['status'] == 0) {
            return response()->json([
                'message' => 'Không thể chuyển phòng về trạng thái trống khi còn hợp đồng hiệu lực.'
            ], 422);
        }
        if ($request->hasFile('image')) {
            if ($room->image) {
                Storage::disk('public')->delete($room->image);
            }
            $validated['image'] = $request
                ->file('image')
                ->store('rooms', 'public');
        }

        $room->update($validated);
        return response()->json([
            'message' => "Cập nhật thông tin phòng {$room->room_name} thành công.",
            'data' => $room
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

        $room = Room::with(['contracts' => function ($query) {
            $query->where('status', 0);
        }])->find($id);

        if (!$room) {
            return response()->json([
                'message' => 'Không tìm thấy phòng này.'
            ], 404);
        }
        if ($room->contracts->isNotEmpty() || $room->status == 1) {
            return response()->json([
                'message' => "Không thể xóa phòng {$room->room_name} do phòng đang có hợp đồng thuê còn hiệu lực. Vui lòng thanh lý hợp đồng trước."
            ], 422);
        }
        $roomName = $room->room_name;
        $room->delete();
        return response()->json([
            'message' => "Xóa phòng {$roomName} thành công."
        ], 200);
    }

    public function options(){
        $user = Auth::user();
        if (!$user || $user->role !== 0) {
            return response()->json(['message' => 'Bạn không có quyền truy cập.'], 403);
        }
        $room=Room::where('status',0)->select('id','room_name','floor','base_price')->orderBy('room_name')->get();
        return response()->json([
            'message'=>"Tải danh sách phòng trống thành công.",
            'data'=>$room
        ]);
    }
}
