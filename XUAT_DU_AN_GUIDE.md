# Hướng Dẫn Sử Dụng Tính Năng "Xuất Dự Án"

## Tổng Quan
Tính năng "Xuất dự án" cho phép xuất hàng dựa trên đơn nhập mới nhất của một nhà cung cấp cụ thể cho khách hàng đã chọn.

## Cách Sử Dụng

### 1. Tạo Phiếu Xuất Dự Án Mới
1. Chọn **"Tạo phiếu xuất kho mới"**
2. Chọn **"Khách hàng"** từ danh sách
3. Chọn **"Loại xuất"** → **"Xuất dự án"**
4. Chọn **"Nhà cung cấp"** (sẽ xuất hiện sau khi chọn "Xuất dự án")
5. Hệ thống sẽ tự động load sản phẩm từ đơn nhập mới nhất của nhà cung cấp đó
6. Điền thông tin còn lại và lưu phiếu

### 2. Xem Chi Tiết Phiếu Xuất Dự Án
- Click vào phiếu xuất trong danh sách để xem chi tiết
- Thông tin nhà cung cấp sẽ hiển thị trong phần "Thông tin chung"

### 3. Copy Phiếu Xuất Dự Án
- Click vào nút **"Copy"** trên phiếu xuất
- Hệ thống sẽ tạo phiếu mới với thông tin tương tự
- Có thể chỉnh sửa thông tin trước khi lưu

## Cấu Trúc Dữ Liệu

### OutboundShipmentFormData
```typescript
interface OutboundShipmentFormData {
  xuat_kho_id: string;
  ngay_xuat: string;
  khach_hang_id: string;
  ten_khach_hang: string;
  loai_xuat: string; // "Xuất hàng" hoặc "Xuất dự án"
  nha_cung_cap_id: string; // Chỉ có khi loai_xuat = "Xuất dự án"
  ten_nha_cung_cap: string; // Chỉ có khi loai_xuat = "Xuất dự án"
  tai_xe: string;
  noi_dung_xuat: string;
  ghi_chu: string;
}
```

### Bảng shipment_headers
- `supplier_id`: ID nhà cung cấp (chỉ lưu khi loai_xuat = "Xuất dự án")
- `supplier_name`: Tên nhà cung cấp (chỉ lưu khi loai_xuat = "Xuất dự án")

## Logic Hoạt Động

### Khi Chọn Nhà Cung Cấp
1. Tìm tất cả đơn nhập của nhà cung cấp cho khách hàng đã chọn
2. Nếu không có, tìm đơn nhập mới nhất của nhà cung cấp (bất kỳ khách hàng nào)
3. Load tất cả sản phẩm từ đơn nhập mới nhất với số lượng đầy đủ
4. Hiển thị sản phẩm trong danh sách với số lượng từ đơn nhập

### Tự Động Hóa
- Khi chọn nhà cung cấp → Tự động load sản phẩm
- Sản phẩm được load với số lượng đầy đủ từ đơn nhập
- Không cần thêm sản phẩm thủ công
- Form nhập sản phẩm bị ẩn khi đã có sản phẩm

## Validation
- **Loại xuất**: Chỉ cho phép "Xuất hàng" hoặc "Xuất dự án"
- **Khách hàng**: Bắt buộc phải chọn
- **Nhà cung cấp**: Bắt buộc khi chọn "Xuất dự án"
- **Sản phẩm**: Ít nhất 1 sản phẩm phải được thêm

## Lợi Ích
1. **Tiết kiệm thời gian**: Tự động load sản phẩm từ đơn nhập
2. **Giảm lỗi**: Không cần nhập lại thông tin sản phẩm
3. **Quy trình chuẩn**: Phù hợp với thực tế (nhập → xuất toàn bộ)
4. **Theo dõi dễ dàng**: Liên kết rõ ràng giữa nhập và xuất

## Troubleshooting

### Không Tìm Thấy Đơn Nhập
- Kiểm tra xem nhà cung cấp đã có đơn nhập chưa
- Kiểm tra xem đơn nhập có đúng loại "inbound" không
- Thử chọn nhà cung cấp khác

### Sản Phẩm Không Load
- Kiểm tra kết nối mạng
- Refresh trang và thử lại
- Kiểm tra console để xem lỗi

### Lỗi Lưu Phiếu
- Kiểm tra thông tin bắt buộc đã điền đầy đủ
- Kiểm tra số lượng sản phẩm > 0
- Thử lưu lại

## Tính Năng Copy Mã Phiếu

### Hiển Thị Mã Phiếu
- Mã phiếu xuất hiện ở góc phải trên cùng của form
- Desktop: Hiển thị đầy đủ mã phiếu (ví dụ: PXK080825_516)
- Mobile: Hiển thị rút gọn (ví dụ: PXK08082...)

### Sao Chép Mã Phiếu
- Click vào icon copy (📋) bên cạnh mã phiếu
- Mã phiếu sẽ được sao chép vào clipboard
- Hiển thị thông báo thành công
- Có thể paste vào bất kỳ đâu để sử dụng

### Lợi Ích
- **Dễ dàng chia sẻ**: Copy mã phiếu nhanh chóng
- **Tham chiếu nhanh**: Không cần ghi nhớ mã dài
- **Tương thích**: Hoạt động trên cả desktop và mobile
- **Phản hồi tức thì**: Thông báo rõ ràng khi copy thành công

## Tính Năng Nhấn Enter Để Thêm Sản Phẩm

### Cách Sử Dụng
- **Nhập thông tin sản phẩm**: Chọn sản phẩm, nhập số lượng, ghi chú
- **Nhấn Enter**: Trong bất kỳ ô nào (SL, Ghi chú) để thêm sản phẩm nhanh
- **Tự động thêm**: Sản phẩm sẽ được thêm vào danh sách ngay lập tức

### Các Ô Hỗ Trợ Enter
- **Ô SL (Số lượng)**: Nhập số lượng và nhấn Enter
- **Ô Ghi chú**: Nhập ghi chú và nhấn Enter
- **Autocomplete sản phẩm**: Chọn sản phẩm từ dropdown

### Hiển Thị Tip
- **Thông báo tip**: "💡 Tip: Nhấn Enter trong bất kỳ ô nào để thêm sản phẩm nhanh"
- **Chỉ hiển thị khi**: Chưa có sản phẩm nào trong danh sách
- **Màu sắc**: Nền vàng nhạt để dễ nhận biết

### Lợi Ích
- **Tăng tốc độ nhập liệu**: Không cần di chuyển chuột để click nút "+"
- **Thao tác thuận tiện**: Chỉ cần nhấn Enter sau khi nhập xong
- **Giảm thời gian**: Đặc biệt hữu ích khi nhập nhiều sản phẩm
- **Trải nghiệm nhất quán**: Giống hệt như form nhập hàng 