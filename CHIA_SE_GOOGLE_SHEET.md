# Hướng dẫn chia sẻ Google Sheet để ghi dữ liệu

## ⚠️ Vấn đề hiện tại
Google Sheet chưa được chia sẻ đúng cách, dẫn đến lỗi 403 (Permission Denied).

## Bước 1: Mở Google Sheet
1. Truy cập: `https://docs.google.com/spreadsheets/d/1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig/edit`
2. Đăng nhập vào tài khoản Google của bạn

## Bước 2: Chia sẻ với Service Account
1. Click nút **"Share"** (góc trên bên phải, màu xanh)
2. Trong hộp thoại "Share with people and groups":
   - Nhập email: `mgessheetqpi@ggsheetapi-432710.iam.gserviceaccount.com`
   - Chọn quyền: **"Editor"**
   - Bỏ tích "Notify people" (không cần thông báo)
3. Click **"Share"**

## Bước 3: Hoặc chia sẻ public (tạm thời)
Nếu không muốn chia sẻ với Service Account, có thể chia sẻ public:

1. Click nút **"Share"**
2. Click **"Change to anyone with the link"**
3. Chọn quyền: **"Editor"**
4. Click **"Done"**

## Bước 4: Kiểm tra quyền truy cập
Sau khi chia sẻ, test lại bằng lệnh:

```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig?key=AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og"
```

Nếu thành công, sẽ thấy thông tin về Google Sheet thay vì lỗi 403.

## Bước 5: Test đọc dữ liệu
```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/1fq89PfqDMeNwwoXxKXrdBMJAvNdRRB49AZfOdCi-Eig/values/DM_SAN_PHAM%21A1:L1?key=AIzaSyB7108787BkEd8BKI2LyWQReL7frFz_0og"
```

## Bước 6: Test ghi dữ liệu
Sau khi chia sẻ thành công, ứng dụng sẽ có thể:
- ✅ Đọc dữ liệu từ Google Sheet
- ✅ Ghi dữ liệu mới vào Google Sheet
- ✅ Cập nhật dữ liệu hiện có

## Lưu ý bảo mật
- **Chia sẻ với Service Account**: An toàn hơn, chỉ Service Account có quyền truy cập
- **Chia sẻ public**: Ai có link cũng có thể truy cập, chỉ dùng cho test
- **Sau khi test xong**: Nên chuyển về chia sẻ với Service Account

## Troubleshooting
- **Lỗi 403**: Google Sheet chưa được chia sẻ
- **Lỗi 404**: Google Sheet không tồn tại hoặc ID sai
- **Lỗi 400**: API Key không đúng hoặc bị hạn chế 