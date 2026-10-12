# Quy tắc dự án (Workspace Rules)

## Tự động commit và push code lên Git
- Mỗi khi hoàn thành việc chỉnh sửa code, sửa lỗi (bug fix) hoặc thêm tính năng mới theo yêu cầu của người dùng, trợ lý Antigravity **luôn tự động**:
  1. `git add` các file đã chỉnh sửa hợp lệ.
  2. `git commit -m "..."` với commit message rõ ràng, chuẩn semantic (ví dụ: `fix: ...`, `feat: ...`).
  3. `git push` lên nhánh remote hiện tại (`github/main` hoặc upstream tương ứng) để đồng bộ ngay lập tức.
