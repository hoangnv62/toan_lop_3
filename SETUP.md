# Hướng dẫn cài đặt & chạy dự án

## Yêu cầu hệ thống

| Công cụ | Phiên bản | Ghi chú |
|---------|-----------|---------|
| Python | **3.12** | Không dùng 3.13+ (pandas/numpy chưa có wheel) |
| Node.js | 18+ | Kèm npm |
| MySQL | 8.0+ | |
| Git | bất kỳ | |

---

## 1. Kéo code về

```bash
git clone <url-repo>
cd toan_lop_3
```

---

## 2. Cài đặt Backend

### 2.1 Tạo virtual environment

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3.12 -m venv venv
source venv/bin/activate
```

> Nếu máy có nhiều phiên bản Python, chỉ định rõ đường dẫn:
> ```bash
> # Ví dụ Windows
> "C:\Python312\python.exe" -m venv venv
> ```

### 2.2 Cài dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Tạo file `.env`

Tạo file `backend/.env` với nội dung sau (điền thông tin thực của máy bạn):

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=math_learning
SECRET_KEY=your_random_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Lấy Gemini API key:** truy cập [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 2.4 Khởi tạo database

> Đảm bảo MySQL đang chạy và thông tin trong `.env` đúng.

```bash
python database/create_db.py
```

Lệnh này sẽ:
- Tạo database `math_learning`
- Tạo toàn bộ bảng
- Tạo dữ liệu mẫu:

| Vai trò | Username | Mật khẩu |
|---------|----------|-----------|
| Giáo viên | `gv1` | `123` |
| Học sinh | `hs1` | `123` |
| Học sinh | `hs2` | `123` |

### 2.5 Chạy server backend

```bash
python app.py
```

Server chạy tại: `http://localhost:5000`

---

## 3. Cài đặt Frontend

Mở terminal mới, **không đóng terminal backend**.

```bash
cd frontend
npm install
npm run dev
```

Ứng dụng chạy tại: `http://localhost:5173`

---

## 4. Kiểm tra hoạt động

1. Mở trình duyệt, truy cập `http://localhost:5173`
2. Đăng nhập với tài khoản giáo viên: `gv1 / 123`
3. Đăng nhập với tài khoản học sinh: `hs1 / 123`

---

## 5. Cấu trúc thư mục

```
toan_lop_3/
├── backend/
│   ├── app.py              # Entry point
│   ├── config.py           # Cấu hình DB, Gemini
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Biến môi trường (tự tạo, không commit)
│   ├── database/
│   │   └── create_db.py    # Script khởi tạo DB
│   ├── models/             # SQLAlchemy ORM models
│   ├── repositories/       # Truy cập dữ liệu
│   ├── services/           # Business logic
│   ├── controllers/        # Xử lý HTTP request
│   └── routes/             # Đăng ký URL Blueprint
└── frontend/
    ├── src/
    │   ├── api/            # Các hàm gọi API
    │   ├── pages/          # Các trang (teacher / student)
    │   ├── components/     # Component dùng chung
    │   └── context/        # AuthContext
    └── package.json
```

---

## 6. Xử lý lỗi thường gặp

### Lỗi `ModuleNotFoundError`
```bash
pip install -r requirements.txt
```

### Lỗi kết nối database
- Kiểm tra MySQL đang chạy
- Kiểm tra `DB_USER`, `DB_PASS`, `DB_HOST` trong `.env` đúng chưa
- Chạy lại `python database/create_db.py`

### Lỗi CORS (frontend không gọi được API)
- Đảm bảo backend đang chạy trên cổng `5000`
- Đảm bảo frontend đang chạy trên cổng `5173`
- Nếu dùng cổng khác, thêm vào danh sách `origins` trong `backend/app.py`

### Frontend báo lỗi `npm install`
- Kiểm tra Node.js >= 18: `node -v`
- Xóa `node_modules` rồi cài lại:
  ```bash
  rm -rf node_modules
  npm install
  ```
