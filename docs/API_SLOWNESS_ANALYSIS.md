# Phân tích chậm / timeout API (trừ Villagers)

## 1. Vấn đề đã gặp

| Hiện tượng | Nguyên nhân khả dĩ |
|------------|--------------------|
| **Tools**: HTTP 500 | Endpoint `GET /nh/tools?excludedetails=true` của Nookipedia trả 500 (lỗi phía server). |
| **Recipes / Catalog**: "Request timed out" | Response `/nh/*` (recipes, items, furniture, …) **chậm** (> 20s) hoặc mạng không ổn định → client abort. |
| **Chỉ Villagers ổn** | Villagers dùng `GET /villagers` (endpoint khác với `/nh/*`), có thể được tối ưu / cache tốt hơn phía Nookipedia. |

**Tóm lại:** Phía **Nookipedia** với các endpoint **/nh/*** (New Horizons catalog, critters, museum, events…) thường **phản hồi chậm** hoặc không ổn định; timeout và retry là cách xử lý **phía client** khi gặp tình trạng đó.

---

## 2. Timeout + retry đã làm — có tối ưu chưa?

**Đã làm:**
- Tăng timeout list/detail `/nh/*` lên **45s**, **retry 1 lần** khi timeout.
- Tăng timeout từng item detail (batch) lên **20s**, giảm concurrency batch **6 → 4**.

**Đánh giá:**

| Ưu điểm | Hạn chế |
|--------|---------|
| Giảm lỗi "timed out" khi server chậm tạm thời hoặc mạng hơi kém. | **Không xử lý gốc**: server vẫn chậm, user vẫn đợi lâu (có khi 45s + 45s retry). |
| Retry giúp vượt qua 1–2 lần lỗi ngẫu nhiên. | Nếu API **luôn** chậm hoặc rate limit, tăng timeout/retry chỉ làm UX tệ hơn (đợi rất lâu rồi mới thấy lỗi). |
| Giảm concurrency giúp tránh “dồn” request, có thể đỡ bị rate limit. | Tốn thêm tài nguyên (gửi lại request), không giảm tải cho server. |

**Kết luận:** Timeout + retry là **giải pháp giảm nhẹ (mitigation)** khi server chậm / không ổn định, **không phải** cách tối ưu gốc. Vẫn nên giữ (45s + 1 retry) nhưng kết hợp thêm các hướng dưới đây.

---

## 3. Các phương án khác

### 3.1. Ưu tiên endpoint nhẹ (đã làm một phần)

- **Hiện trạng:** Đã dùng `excludedetails=true` cho list names; khi 5xx/timeout thì fallback sang full list.
- **Gợi ý:** Luôn ưu tiên endpoint trả **ít dữ liệu** (names, IDs) thay vì full object khi chỉ cần list/pagination. Không gọi full list khi chỉ cần 1 trang.

→ **Đã tối ưu đúng hướng;** tiếp tục tránh gọi full list không cần thiết.

---

### 3.2. Cache mạnh hơn (client)

- **Hiện trạng:** `catalogUtils`: cache theo prefix + category, TTL 24h; Catalog load names rồi mới load detail theo trang.
- **Gợi ý:**
  - **Stale-while-revalidate:** Lần vào tab, ưu tiên **hiển thị cache cũ ngay** (nếu còn trong TTL), đồng thời gọi API cập nhật nền; khi API xong thì cập nhật UI. User thấy dữ liệu gần như ngay, ít bị “trắng” hoặc loading lâu.
  - Có thể tách cache **list names** (ít thay đổi) với cache **detail từng item** (đã có), để names ít khi gọi API lại.

→ **Đề xuất:** Làm stale-while-revalidate cho Catalog (và nơi nào cũng đang load list + detail) để giảm cảm giác chậm dù API vẫn chậm.

---

### 3.3. Giảm số request và payload (đã làm một phần)

- **Hiện trạng:** Chỉ load detail cho **trang hiện tại**; batch 4 item/lần.
- **Gợi ý:**
  - Giữ concurrency 4 (hoặc thử 3 nếu vẫn bị 429/timeout).
  - Không gọi lại list names khi chỉ đổi trang (đã đúng); tránh effect gọi API trùng lặp khi mount/strict mode.

→ **Đã ổn;** chỉ cần kiểm tra không có double-fetch (xem 3.7).

---

### 3.4. Proxy + cache phía server (thay đổi kiến trúc)

- **Ý tưởng:** Thêm backend (Next.js API Routes, Vercel Serverless, …) làm proxy tới Nookipedia; backend cache response (Redis / in-memory) vài phút hoặc vài giờ.
- **Ưu:** Giảm số request tới Nookipedia, trả nhanh hơn cho user sau lần đầu.
- **Nhược:** App hiện dùng static export (không chạy server); cần đổi cách deploy (host có server) và bảo trì cache.

→ **Đề xuất:** Chỉ làm khi cần tối ưu lâu dài và chấp nhận chạy server.

---

### 3.5. UX khi chậm / lỗi

- **Hiện trạng:** Có loading, có retry, có ErrorRetry.
- **Gợi ý:**
  - Sau **15–20s** chưa xong: hiển thị “Đang tải lâu hơn bình thường, vui lòng đợi thêm hoặc thử lại.”
  - Nút **Hủy** để abort request và quay lại (dùng `AbortController`).
  - Phân biệt **timeout** vs **lỗi mạng** vs **5xx** để message rõ ràng hơn.

→ **Đề xuất:** Làm để người dùng không nghĩ app “đơ” khi API chậm.

---

### 3.6. Service Worker / Cache API

- Cache response GET theo URL + query trong Cache API (TTL ngắn, ví dụ 5–10 phút).
- Lần sau vào cùng tab/cùng filter: dùng cache trước, sau đó revalidate nền.
- **Nhược:** Cần đăng ký service worker, xử lý version cache; phức tạp hơn stale-while-revalidate trong React.

→ Có thể làm sau khi đã có stale-while-revalidate ở 3.2.

---

### 3.7. Tránh gọi API trùng (double-fetch)

- **Nguy cơ:** React Strict Mode hoặc dependency effect sai khiến cùng một list/endpoint bị gọi 2 lần khi mount.
- **Cách làm:** Rà soát các `useEffect` gọi `getRecipeNames`, `getFurnitureNames`, `getCritters`, …: đảm bảo dependency đúng, có cleanup (abort/cancel) khi unmount hoặc khi dependency đổi, tránh setState sau khi unmount.

→ **Đề xuất:** Kiểm tra nhanh các catalog + critters + museum; nếu có double-fetch thì sửa để giảm tải và tránh timeout “ảo” do 2 request cùng lúc.

---

## 4. Thứ tự ưu tiên đề xuất

1. **Giữ** timeout 45s + retry 1 lần cho `/nh/*` (đã có).
2. **Kiểm tra** double-fetch (3.7) và sửa nếu có.
3. **Thêm** stale-while-revalidate (3.2) cho Catalog (và các màn tương tự): hiển thị cache trước, fetch nền.
4. **Cải thiện UX** (3.5): thông báo “đang tải lâu”, nút hủy, message lỗi rõ ràng.
5. **Nếu vẫn chậm:** Cân nhắc proxy + cache server (3.4) khi có điều kiện chạy backend.

---

## 5. Đã triển khai (theo đề xuất)

- **3.7 Double-fetch:** Đã thêm cleanup `cancelled` (và ref cho group load) cho toàn bộ Catalog (Items, Tools, Furniture, Clothing, Interior, Photos, Recipes), Critterpedia và Museum. Khi đổi tab/filter hoặc unmount, response cũ không ghi đè state.
- **3.2 Stale-while-revalidate:** Các tab Catalog khi vào sẽ hiển thị **cache ngay** (names từ `Object.keys(cache)` nếu có), sau đó gọi API và cập nhật khi xong. Lần vào sau hoặc khi đã có cache, user thấy dữ liệu gần như ngay.
- **3.5 UX:**
  - **SlowLoadingMessage:** Sau 15s vẫn loading thì hiện dòng "Đang tải lâu hơn bình thường. Vui lòng đợi thêm hoặc thử lại." (component dùng chung, có style `.ct-slow-loading`).
  - **formatApiErrorMessage:** Lỗi API được chuẩn hóa: timeout → "Request quá thời gian chờ...", HTTP 5xx → "Server lỗi tạm thời...", lỗi mạng → "Lỗi mạng. Kiểm tra kết nối...".
