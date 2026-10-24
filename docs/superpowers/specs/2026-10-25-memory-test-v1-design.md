# Memory Test v1 — Design

Ngày: 2026-10-25 · Chủ dự án: Tuan Luu · Nguồn: `index.html` (v0), bản nháp `Kế hoạch mở rộng Memory Test.docx`

Ký hiệu: **[Tuan]** = chủ dự án đã quyết · **[Claude]** = Claude quyết thay, chủ dự án có thể đổi.

## 1. Mục đích và lý do

v0 là một file HTML: hiện 15 từ (mỗi từ 1,5 giây), người chơi nhập lại các từ nhớ được, rồi xem kết quả theo vị trí cùng thông điệp về hiệu ứng đầu–cuối (primacy–recency). Không có gì được lưu lại.

v1 thêm tài khoản, lịch sử và bảng xếp hạng. Mục tiêu là người chơi muốn quay lại, và có dữ liệu thật qua nhiều lượt để thấy đường cong chữ U. [Tuan]

Ngoài ra, đây còn là dự án để chủ dự án **học cách làm việc với Claude và superpowers**. Vì vậy repo phải có tài liệu để AI ở phiên sau đọc là hiểu (mục 8). [Tuan]

## 2. Mục tiêu, ngoài phạm vi, những điều không được xảy ra

**Mục tiêu**
- Khách chưa đăng nhập chơi y như v0. Ở màn kết quả, hiện một modal mời đăng nhập hoặc đăng ký để lưu kết quả. [Tuan]
- Đăng ký hoặc đăng nhập ngay trong modal đó thì **lượt vừa chơi được lưu vào tài khoản**. [Claude]
- Người đã đăng nhập: kết quả tự lưu, không hiện modal, có trang **History** và trang **Leaderboard**. [Tuan]
- Đưa lên Netlify cho người khác vào chơi. [Tuan]

**Ngoài phạm vi (v1)**
- Đăng nhập Google hay mạng xã hội khác. [Tuan]
- Quên mật khẩu, xác nhận email, đổi tên hiển thị. [Claude]
- Cho người chơi chọn chủ đề từ. [Tuan]
- So sánh với LLM. [Tuan, theo bản nháp]
- Chống gian lận tuyệt đối. Người chơi vẫn có thể đọc danh sách từ trong network tab; v1 chỉ chặn việc **tự khai điểm**. [Claude]

**Những điều không được xảy ra**
- Trải nghiệm chơi khác v0: thời gian hiện từ, số từ, giao diện card tối, nội dung insight, các chip từ, biểu đồ vị trí. Phải giữ nguyên.
- Lộ email của người khác trên Leaderboard.
- Lượt có bấm Replay lọt vào rank hoặc thống kê.
- Đụng vào các site Netlify đang có sẵn trong tài khoản (`sotaytrietgia`, `danangbridges`, `causonghan`, `caudanang`, `mhotelsresortsdanang`, `demo-gatsby-contentful-blog`).
- Commit secrets. `.env.local` tuyệt đối không vào git.

## 3. Ràng buộc

- **Thực thi hoàn toàn tự động, không cần người can thiệp.** Mọi bước (tạo bảng, seed dữ liệu, cấu hình Auth, test, deploy) phải chạy được bằng CLI/API với các credential sẵn có trong `.env.local`. [Tuan]
- **Tiết kiệm token.** Ưu tiên giải pháp đơn giản, ít file, ít dependency. [Tuan]
- **Credential trong `.env.local`** (đã kiểm tra, đều dùng được): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` (chưa kiểm chứng; dùng lần đầu khi chạy migration), `NETLIFY_AUTH_TOKEN`.
- **Supabase:** project ở region ap-southeast-1, đang `ACTIVE_HEALTHY`. Email auth đã bật, xác nhận email đã tắt (autoconfirm).
- **Môi trường:** Windows 11, Node 24, npm 11, git 2.47. Thư mục hiện **chưa phải git repo**.
- **Ngôn ngữ giao diện:** tiếng Anh. [Tuan]

## 4. Stack [Tuan, theo bản nháp]

- Vite + React + TypeScript, Tailwind CSS, React Router.
- Supabase: Postgres, Auth, RPC qua `supabase-js`. Không có server riêng.
- Biểu đồ: SVG/CSS tự vẽ như v0, không thêm thư viện chart. [Claude]
- Test: Vitest và Playwright.
- Deploy: Netlify CLI, deploy thư mục `dist` đã build sẵn, có `netlify.toml` với SPA redirect `/* → /index.html 200`.

## 5. Luồng và màn hình

**Thanh trên cùng** [Claude]
- Chưa đăng nhập: logo "Memory Test" (về `/`), link "Leaderboard", nút "Log in".
- Đã đăng nhập: logo, "History", "Leaderboard", email người chơi, nút "Log out".

**Route**
- `/`: game. Intro → trình chiếu → nhập lại → kết quả. Giữ nguyên v0.
- `/history`: chỉ dành cho người đã đăng nhập; khách vào sẽ được đưa về `/` và mở modal đăng nhập.
- `/leaderboard`: ai cũng xem được. [Claude]

**Modal Auth**
- Hai tab "Log in" / "Sign up", dùng email + mật khẩu (tối thiểu 6 ký tự, theo mặc định của Supabase).
- Có nút đóng.
- Mở từ nút "Log in" trên thanh trên cùng, hoặc tự mở ở màn kết quả khi là khách.
- Tiêu đề khi mở ở màn kết quả: "Save this result — log in or sign up".

**Màn kết quả**
- Giống v0.
- Nếu là khách: modal tự mở khoảng 1 giây sau khi kết quả hiện ra, để người chơi kịp nhìn điểm trước. [Claude]
- Đóng modal thì vẫn xem kết quả bình thường. Ngay dưới điểm có thêm một dòng nhỏ "Log in to save this result" để mở lại modal. [Claude]

**History** [Claude]
- Một biểu đồ "Your serial-position curve": tỉ lệ nhớ trung bình theo vị trí 1–15 trên mọi lượt hợp lệ, kèm dòng "Based on N games".
- Nếu N < 5, hiện ghi chú "Play a few more games to see a reliable curve", theo rủi ro "dữ liệu ít" trong bản nháp.
- Bên dưới là danh sách các lượt, mới nhất ở trên: ngày giờ, điểm x/15, nhãn "replayed" nếu có.
- Không cần trang chi tiết cho từng lượt.

**Leaderboard** [Claude]
- Top 20: mỗi người một dòng, gồm hạng, tên hiển thị, điểm cao nhất, số lượt hợp lệ.
- Thứ tự: điểm cao nhất giảm dần; bằng điểm thì ai đạt điểm đó sớm hơn xếp trên.
- **Tên hiển thị = phần trước `@` của email.**
- Nếu người đang xem có tên trong bảng thì dòng của họ được làm nổi bật.

**Replay** (nút "Replay words (defeats the exercise)" như v0)
- Bấm Replay sẽ đánh dấu lượt đó là `replayed`; lượt này bị loại khỏi rank và thống kê.
- Sau Replay, người chơi nhập lại và xem kết quả như v0, nhưng **kết quả lần hai chỉ chấm ở client và không lưu**. Lần nộp đầu vẫn là bản được lưu. [Claude]

## 6. Dữ liệu và logic phía server [Claude, phát triển từ bản nháp]

**Bảng**
- `words(id, word unique, topic)`: kho khoảng 300 từ tiếng Anh thông dụng, thuộc khoảng 10 chủ đề (ví dụ animals, food, nature, objects, places, music, sports, weather, tools, body).
  - Seed bằng migration.
  - Mỗi lượt **trộn từ mọi chủ đề**, 15 từ không trùng nhau. [Tuan]
  - Cột `topic` chỉ để tổ chức kho từ, chưa dùng trên giao diện.
- `sessions(id uuid, user_id null, claim_token uuid, created_at, submitted_at null, word_count, show_ms, score null, replayed bool default false)`
- `session_items(session_id, position 1..N, word, recalled bool null)`

**RPC** (Postgres functions, `security definer`). Client chỉ gọi các hàm này, không ghi thẳng vào bảng.
- `start_session()`
  - Bốc ngẫu nhiên 15 từ, tạo session (gắn `user_id` nếu đã đăng nhập) và các `session_items` theo đúng thứ tự.
  - Trả về `{session_id, claim_token, words[]}`.
- `submit_session(session_id, typed text)`
  - Chấm điểm phía server với đúng luật của v0: lowercase, tách theo `[\s,;]+`, bỏ ký tự không phải a–z, so khớp chính xác.
  - Ghi `recalled` và `score`. Chỉ chấp nhận một lần nộp; nộp lần hai bị từ chối.
  - Trả về `{score, recalled[]}`.
- `mark_replayed(session_id)`
- `claim_session(session_id, claim_token)`
  - Gắn session của khách vào `auth.uid()`.
  - Chỉ thành công khi: `user_id` đang null, token khớp, và session được tạo trong vòng 1 giờ.
- `get_leaderboard()`: trả về top 20 như mục 5, **không trả email**.
- `get_my_history()` và `get_my_position_stats()`: chỉ dữ liệu của `auth.uid()`; thống kê loại các lượt `replayed` và các lượt chưa nộp.

**Bảo mật**
- Bật RLS trên mọi bảng. Không cấp quyền insert/update/delete trực tiếp cho `anon` hay `authenticated`.
- Client giữ `session_id` và `claim_token` trong bộ nhớ của trang. Khi đăng ký hoặc đăng nhập từ modal, client gọi `claim_session` ngay. [Claude]
- **Không kiểm tra thời gian tối thiểu** khi nộp bài, vì chế độ test chạy nhanh sẽ vấp phải nó. Vẫn được ghi nhận là một lỗ hổng chấp nhận được. [Claude]

**Migration:** dùng Supabase CLI (`npx supabase`) với Access Token và DB password. File migration đặt trong `supabase/migrations/`.

**Cấu hình Auth qua Management API:** Site URL đặt bằng URL Netlify sau khi deploy; thêm `http://localhost:5173` vào danh sách redirect URL.

## 7. Test

- **Vitest:** logic phía client (tách từ để chấm lại sau Replay, tính phần trăm đầu/giữa/cuối).
- **Integration test (Vitest + supabase-js với project thật):** start → submit → điểm đúng; nộp lần hai bị từ chối; claim thành công/thất bại; khách không đọc được session của người khác; leaderboard không chứa email; lượt replayed bị loại khỏi thống kê.
- **Playwright:** luồng "khách chơi → modal → sign up → kết quả được lưu → History hiện lượt đó → Leaderboard có tên". Thêm luồng "đã đăng nhập chơi → tự lưu, không có modal".
- **Chế độ test nhanh:** query `?fast=1` thu nhỏ `showMs`, `gapMs`, `doneMs` (ví dụ 50/10/50 ms). Chỉ bật khi build ở chế độ dev/test, **không có trong bản production**. [Claude]
- **Tài khoản test:** dùng email dạng `e2e+<timestamp>@example.com`. Phải bị xoá sau khi test (bằng SQL qua DB password, hoặc bằng secret key lấy qua Management API; builder tự chọn cách). Xoá user phải **cascade** xoá luôn sessions và session_items của họ. [Claude]
- **Dev/test dùng chung project Supabase với production:** `start_session` nhận tham số `show_ms` (client gửi giá trị đang dùng thật). Leaderboard và thống kê **chỉ tính lượt có `word_count = 15` và `show_ms = 1500`**, để các lượt chơi nhanh `?fast=1` không lọt vào. [Claude]

## 8. Tài liệu cho AI [Tuan]

```
CLAUDE.md                                  ← trỏ tới các file dưới; Claude Code tự đọc file này
.github/
  copilot-instructions.md                  ← tổng quan project
  instructions/*.instructions.md           ← quy tắc theo loại file (React/TS, SQL/migration, test), có frontmatter applyTo
  agents/*.agent.md                        ← vài agent chuyên trách (ví dụ: tester, reviewer)
  memory-bank/
    projectbrief.md  productContext.md  systemPatterns.md  techContext.md
    activeContext.md progress.md        decisions.md
```

- Nội dung phải **phản ánh đúng project sau khi làm xong**: kiến trúc, lệnh chạy và test, các quyết định trong tài liệu này (đưa vào `decisions.md`, kèm lý do).
- Viết ngắn gọn; không chép lại code.
- Ngôn ngữ: tiếng Anh, để AI đọc thống nhất. [Claude]

## 9. Repo và deploy

- `git init`. Thêm `.gitignore` gồm `.env.local`, `node_modules`, `dist`, `*.docx`, các thư mục kết quả test.
  - File docx giữ nguyên chỗ cũ và không commit. [Claude]
- Chuyển `index.html` của v0 sang `legacy/index.v0.html` để tham chiếu; `index.html` ở thư mục gốc là entry của Vite. [Claude]
- Không cần GitHub remote.
- Netlify:
  - Trước khi tạo site, kiểm tra token thuộc bao nhiêu team. Nếu nhiều hơn một, dùng team đang chứa các site có sẵn ở mục 2. [Claude]
  - Tạo **một site mới** tên `memory-test-tuan` (nếu tên đã bị chiếm thì thêm hậu tố).
  - Build local với các biến `VITE_*`, rồi chạy `netlify deploy --prod --dir dist`.
  - Báo lại URL cho chủ dự án.

## 10. Để builder tự quyết

Cấu trúc thư mục `src/`, cách chia component, nội dung cụ thể của kho từ, chi tiết style Tailwind (phải khớp màu và font của v0), và cách xoá tài khoản test.
