# Báo cáo thực thi Memory Test v1, ngày 2026-10-25

**Tóm tắt:** Xong 9/10 task. Task 8 (deploy Netlify) bị chặn vì Netlify token trả về 401.

- Code nằm trên branch `feat/v1`: 10 commit, **chưa merge** vào `main`.
- Test: **17 unit, 11 integration (Supabase thật), 9 e2e (Playwright)**, tất cả đều pass. Build OK. Không còn user test nào trong DB.
- Review cuối do một reviewer độc lập (Opus) làm: 0 Critical, 4 Important (đều đã sửa), 8 Minor (để bạn quyết định).

## ⚠️ Việc bạn cần làm

| # | Việc | Cách làm |
|---|---|---|
| 1 | **Tạo Netlify token mới.** Token cũ còn chạy lúc 01:2x, đến lúc deploy thì báo 401 trên mọi endpoint. File `.env.local` không bị đổi, nên nhiều khả năng token đã hết hạn hoặc bị thu hồi. | Vào https://app.netlify.com/user/applications và tạo token mới, chọn **Expiration** dài hơn. Sau đó thay dòng `NETLIFY_AUTH_TOKEN=` trong `.env.local`. |
| 2 | Deploy | Bảo Claude "deploy", hoặc tự chạy `node --env-file=.env.local scripts/deploy.mjs`. Script chỉ tạo hoặc dùng site tên đúng `memory-test-tuan`. |
| 3 | Kiểm tra sau deploy | Mở `<url>/history` và `<url>/leaderboard`, cả hai phải trả về 200. Chạy thêm `BASE_URL=<url> npx playwright test pages -g leaderboard`. |
| 4 | Merge branch | Chạy skill `superpowers:finishing-a-development-branch`: merge `feat/v1` vào `main`, hoặc giữ nguyên branch. |

## Các quyết định mình đã tự đưa ra

| Task | Quyết định | Lý do | Nếu sai thì mất gì |
|---|---|---|---|
| Setup | Không dùng worktree; làm trên branch `feat/v1` | Repo mới tạo, worktree không có tác dụng gì thêm | Không |
| 1 | Giữ nguyên CSS của v0 trong `src/index.css`, thêm token Tailwind bên cạnh | Đảm bảo giao diện giống hệt v0 | Code ít "chuẩn Tailwind" hơn |
| 1 | Cho phép install script của esbuild và netlify-cli | npm 11 chặn mặc định, mà vite và Netlify CLI cần chúng | Không |
| 1 | Thêm `@types/node` và `@testing-library/jest-dom` | Cần cho type-check và cho test DOM | Thêm 2 dev dependency |
| 2 | Kho từ có vài từ 3 chữ cái (zoo, fog, axe…) | Spec chỉ yêu cầu từ tiếng Anh thông dụng | Từ hơi dễ nhớ hơn |
| 2 | Migration chạy bằng Supabase CLI và đã thành công. DB password đúng. | Cách chạy theo đúng plan | Không |
| 3 | Thêm hàm nội bộ `_owned_session` dùng chung cho submit và replay | Không lặp lại logic kiểm tra quyền sở hữu | Không |
| 5 | Phần intro ghi cố định "1.5 seconds" | Chế độ nhanh không làm đổi chữ hiển thị | Không |
| 5 | Nếu submit lỗi mạng thì hiện thẻ "Try again" và bắt đầu lượt mới | Tránh kẹt ở màn nhập | Mất các từ đã gõ khi rớt mạng |
| 6 | Modal mở sẵn ở tab "Sign up" | Lời mời lưu kết quả nhắm tới người mới | Người đã có tài khoản phải bấm thêm một lần |
| 6 | Claim thất bại (quá 1 giờ) thì link "Log in to save" vẫn hiện, không báo gì | Spec không nói tới trường hợp này | Người dùng không biết vì sao không lưu được |
| 7 | Thêm cờ `ready` cho auth. Đây là **bug mình tự phát hiện**: vào thẳng `/history` khi đã đăng nhập vẫn bị đá về `/`. | Đã có e2e chứng minh: fail trước khi sửa, pass sau khi sửa | Không |
| 7 | History và Leaderboard hiển thị lỗi RPC như dữ liệu rỗng | Spec không nói tới | Lỗi trông giống "chưa có dữ liệu" |
| 8 | Thêm `scripts/sites-snapshot.mjs` để chứng minh 6 site cũ không bị đụng | An toàn cho tài khoản Netlify của bạn | Không |
| Final | Bật `allowJs` trong tsconfig để test được `scripts/deploy-lib.mjs` | Cần để test logic deploy | Không |

## Review cuối: 4 lỗi Important đã sửa (mỗi lỗi có test fail trước rồi pass sau)

1. Script deploy có thể nhận nhầm site có tên gần giống (ví dụ `memory-test-tuan-old`). Đã sửa: giờ chỉ khớp đúng tên.
2. Script deploy ghi đè toàn bộ redirect URL của Supabase Auth. Đã sửa: giờ gộp với các URL đang có.
3. Script không kiểm tra response của API, nên gặp lỗi 401 thì crash khó hiểu. Đã sửa: giờ báo `netlify /accounts failed: 401`, và có phân trang danh sách site.
4. Thêm `public/_redirects` làm phương án dự phòng cho việc refresh trang SPA trên Netlify.

## 8 lỗi Minor để bạn quyết định (mình chưa sửa)

1. `start_session` nhận `p_show_ms` bất kỳ và không giới hạn tần suất gọi. `p_typed` không giới hạn độ dài. Các session của khách không bao giờ được dọn.
2. Đăng xuất rồi bấm Replay thì lệnh `markReplayed` bị từ chối mà không báo gì, nên lượt đó vẫn được tính vào rank.
3. Người đã đăng nhập mà claim thất bại vẫn thấy dòng "Log in to save this result".
4. Bấm đăng xuất khi đang ở `/history` thì modal đăng nhập bật lên.
5. `AuthModal` thiếu `try/finally`. Nếu sau này bật lại xác nhận email, đăng ký sẽ đóng modal mà không báo "check your email".
6. History và Leaderboard hiển thị lỗi giống như trạng thái rỗng.
7. File `tsconfig.tsbuildinfo` bị commit, nên thêm vào `.gitignore`.
8. Các migration sau phải lặp lại lệnh `revoke` cho function mới, vì mặc định Supabase cấp quyền cho `anon`.

## Bài học về superpowers qua dự án này

- **Brainstorming → spec → builder check:** reviewer đọc spec như người sắp code và không cần hỏi lại bạn câu nào. Vì vậy lúc chạy, mình không phải dừng lại hỏi lần nào.
- **TDD bắt được bug thật:** bug `ready` ở `/history` và lỗi `position` trong SQL đều lộ ra nhờ test, trước khi tới tay người dùng.
- **Native + một reviewer cuối:** rẻ hơn nhiều so với subagent cho mỗi task, và reviewer vẫn tìm ra 3 lỗi nguy hiểm trong script deploy.
- **Điểm yếu lộ ra:** những thứ phụ thuộc bên ngoài, như token có hạn dùng, không test trước được. Lần sau nên kiểm tra token ngay trước bước cần dùng, hoặc tạo token không hết hạn.
