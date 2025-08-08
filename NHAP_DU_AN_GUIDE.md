# Hướng Dẫn Sử Dụng Tính Năng Nhập Dự Án

## Tổng Quan
Hệ thống quản lý nhập kho hiện tại hỗ trợ 2 loại nhập chính:

1. **Nhập hàng**: Nhập hàng hóa thông thường từ nhà cung cấp
2. **Nhập dự án**: Nhập hàng hóa liên quan đến một dự án cụ thể của khách hàng

Tính năng "Nhập dự án" cho phép bạn tạo phiếu nhập kho liên quan đến một dự án cụ thể của khách hàng. Khi chọn loại nhập này, hệ thống sẽ yêu cầu bạn chọn khách hàng để theo dõi hàng hóa nhập vào cho dự án nào.

## Cách Sử Dụng

### 1. Tạo Phiếu Nhập Dự Án Mới

1. **Mở trang Quản Lý Nhập Kho**
   - Vào menu "Quản lý nhập kho"
   - Click nút "Thêm mới"

2. **Chọn Loại Nhập**
   - Trong dropdown "Loại nhập", chọn "Nhập dự án"
   - Khi chọn loại này, một input "Khách hàng" sẽ xuất hiện

3. **Chọn Khách Hàng**
   - Click vào dropdown "Khách hàng"
   - Chọn khách hàng có dự án cần nhập hàng
   - Hệ thống sẽ hiển thị tên đầy đủ hoặc tên hiển thị của khách hàng

4. **Điền Thông Tin Khác**
   - Nhà cung cấp: Chọn nhà cung cấp hàng hóa
   - Ngày nhập: Chọn ngày nhập kho
   - Tài xế: Chọn tài xế vận chuyển
   - Nội dung nhập: Mô tả nội dung nhập
   - Ghi chú: Thông tin bổ sung

5. **Thêm Sản Phẩm**
   - Click nút "+" để thêm sản phẩm
   - Chọn sản phẩm từ danh sách (sẽ được lọc theo nhà cung cấp đã chọn)
   - Nhập số lượng và ghi chú cho từng sản phẩm

6. **Lưu Phiếu**
   - Click "Lưu" để tạo phiếu nhập dự án
   - Hệ thống sẽ kiểm tra và yêu cầu chọn khách hàng nếu chưa chọn

### 2. Xem Danh Sách Phiếu Nhập Dự Án

- **Trong bảng danh sách**: Cột "Khách hàng" sẽ hiển thị tên khách hàng cho các phiếu nhập dự án
- **Màu sắc chip**: Phiếu nhập dự án có màu xanh dương (info)
- **Lọc dữ liệu**: Có thể tìm kiếm theo tên khách hàng

### 3. Xem Chi Tiết Phiếu Nhập Dự Án

- Click nút "Xem" trên phiếu nhập dự án
- Thông tin khách hàng sẽ hiển thị trong phần "Thông tin chung"
- Có thể chỉnh sửa hoặc sao chép phiếu

### 4. Import Excel Cho Nhập Dự Án

1. **Chuẩn Bị File Excel**
   - File Excel cần có cột "Loại nhập" với giá trị "Nhập hàng" hoặc "Nhập dự án"
   - Nếu chọn "Nhập dự án", có thể thêm cột "Mã KH" và "Tên KH" cho thông tin khách hàng (tùy chọn)

2. **Import Dữ Liệu**
   - Click "Import Excel"
   - Chọn file Excel
   - Trong form bổ sung, chọn khách hàng từ dropdown
   - Hệ thống sẽ tự động gán khách hàng cho tất cả phiếu nhập dự án

## Cấu Trúc Dữ Liệu

### Bảng shipment_headers
- `customer_id`: ID của khách hàng (chỉ có khi loại nhập = "Nhập dự án")
- `customer_name`: Tên khách hàng (chỉ có khi loại nhập = "Nhập dự án")
- `import_type`: Loại nhập ("Nhập hàng", "Nhập dự án")

### Validation
- Khi chọn "Nhập dự án", bắt buộc phải chọn khách hàng
- Hệ thống sẽ hiển thị thông báo lỗi nếu chưa chọn khách hàng

## Lợi Ích

1. **Theo dõi dự án**: Dễ dàng quản lý hàng hóa nhập vào cho từng dự án
2. **Báo cáo chi tiết**: Có thể tạo báo cáo theo khách hàng/dự án
3. **Quản lý tồn kho**: Phân biệt hàng hóa theo dự án
4. **Tính toán chi phí**: Theo dõi chi phí hàng hóa cho từng dự án

## Lưu Ý

- Hệ thống chỉ hỗ trợ 2 loại nhập: "Nhập hàng" và "Nhập dự án"
- Chỉ hiển thị input khách hàng khi chọn "Nhập dự án"
- Khi chọn nhà cung cấp, danh sách sản phẩm sẽ được lọc theo nhà cung cấp đó
- Có thể chỉnh sửa thông tin khách hàng sau khi tạo phiếu
- Dữ liệu khách hàng được lưu trữ trong database để báo cáo
- Hỗ trợ import Excel với thông tin khách hàng
- Các phiếu nhập cũ có loại "Nhập trả" hoặc "Nhập khác" vẫn được hiển thị bình thường 

# Cập nhật thêm cột kiện hàng trong supabase 

## Tính năng mới: Nhấn Enter để thêm sản phẩm nhanh

- **Nhấn Enter** trong bất kỳ ô nào (SL, Kiện hàng, Ghi chú) để thêm sản phẩm nhanh
- Không cần phải click vào nút "+" 
- Tăng tốc độ nhập liệu đáng kể
- Hoạt động trên cả desktop và mobile

## Tối ưu hóa mã phiếu

### Format mã phiếu mới:
- **Phiếu nhập**: `PNK250124_001` (PNK + ngày/tháng/năm + số thứ tự)
- **Phiếu xuất**: `PXK250124_001` (PXK + ngày/tháng/năm + số thứ tự)

### Ví dụ:
- `PNK250124_001` = Phiếu nhập kho ngày 25/01/2024, số thứ tự 001
- `PXK250124_015` = Phiếu xuất kho ngày 25/01/2024, số thứ tự 015

### Lợi ích:
- **Ngắn gọn**: Từ 30+ ký tự xuống còn 12-13 ký tự
- **Dễ đọc**: Format ngày tháng quen thuộc
- **Dễ tìm kiếm**: Có thể tìm theo ngày tháng
- **Không trùng lặp**: Số thứ tự ngẫu nhiên 3 chữ số

## Tính năng tìm kiếm nâng cao

### Autocomplete cho Nhà cung cấp và Khách hàng:
- **Tìm kiếm thông minh**: Gõ tên để tìm nhanh nhà cung cấp/khách hàng
- **Hiển thị thông tin chi tiết**: Tên đầy đủ, loại khách hàng
- **Tìm kiếm đa tiêu chí**: Tìm theo tên, tên đầy đủ, loại khách hàng
- **Giao diện thân thiện**: Dropdown với thông tin chi tiết

### Cách sử dụng:
1. **Nhà cung cấp**: Gõ tên nhà cung cấp để tìm nhanh
2. **Khách hàng**: Chỉ hiển thị khi chọn "Nhập dự án"
3. **Tìm kiếm**: Hỗ trợ tìm theo tên viết tắt hoặc tên đầy đủ
4. **Tài xế**: Nhập tên tài xế tự do (không giới hạn danh sách)

## Hiển thị và sao chép mã phiếu

### Tính năng mới:
- **Hiển thị mã phiếu**: Mã phiếu được hiển thị ở góc phải trên form với nền màu xanh
- **Icon sao chép**: Click vào icon copy để sao chép mã phiếu vào clipboard
- **Thông báo**: Hiển thị thông báo "Đã sao chép mã phiếu vào clipboard!" khi copy thành công
- **Tooltip**: Hover vào icon để xem hướng dẫn "Sao chép mã phiếu"

### Cách sử dụng:
1. Mã phiếu hiển thị tự động khi tạo phiếu mới
2. Click vào icon copy (📋) bên cạnh mã phiếu
3. Mã phiếu sẽ được sao chép vào clipboard
4. Có thể paste vào bất kỳ đâu (chat, email, tài liệu...)

Chạy lệnh SQL sau trong Supabase SQL Editor:

-- Thêm cột kien_hang vào bảng shipment_items
ALTER TABLE shipment_items 
ADD COLUMN IF NOT EXISTS kien_hang INTEGER DEFAULT 1;

-- Tạo index cho cột kien_hang (tùy chọn, để tối ưu hiệu suất)
CREATE INDEX IF NOT EXISTS idx_shipment_items_kien_hang ON shipment_items(kien_hang);

-- Cập nhật dữ liệu cũ (nếu có) - đặt giá trị mặc định là 1
UPDATE shipment_items 
SET kien_hang = 1 
WHERE kien_hang IS NULL;