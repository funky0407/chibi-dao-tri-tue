# Bé Chibi Phiêu Lưu Đảo Trí Tuệ

Game giải đố cho học sinh tiểu học, viết bằng Phaser 3 (HTML5). Bản chơi thử gồm **Đảo Dâu Tây (Lớp 1)** với 7 mini-game và 1 Boss.

## Chạy game

Bấm đúp **`ChoiGame.bat`** (ở thư mục ngoài, cạnh `chibi-puzzle`). File này chạy `server.py` và mở http://localhost:5173.
Không mở trực tiếp `index.html`: trình duyệt chặn ES modules qua `file://`.

`server.py` giống `python -m http.server` nhưng gửi `Cache-Control: no-store`, nên sau khi cập nhật game, trình duyệt luôn tải file mới. Có thể chạy tay:

```bash
py server.py 5173
```

Cần có Internet để tải Phaser và font Baloo 2 từ CDN.

## Bản web (chơi trên điện thoại)

Game được đăng lên claude.ai: https://claude.ai/artifact/Mh56LyozmTj8rUHjKMMJoK

- `web.html` là trang dùng cho bản web (giống `index.html` nhưng không có thẻ `<html>/<head>/<body>`, vì trang đăng sẽ tự bọc). Nó dùng chung thư mục `src/`.
- Sửa game xong thì đăng lại `web.html` kèm các file `src/` đã đổi, cùng địa chỉ cũ.
- Tiến độ lưu riêng trên từng máy (localStorage), không đồng bộ giữa các điện thoại.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/art/svg.js` | Toàn bộ hình chibi vẽ bằng SVG (nhân vật, cú Bông, đồ vật, nền). Thay hình: giữ key và kích thước. |
| `src/core/` | Lưu tiến độ (localStorage), âm thanh + giọng đọc, sinh câu hỏi, phần thưởng. |
| `src/ui/` | Nút, thẻ lựa chọn, hiệu ứng, cú Bông nói gợi ý. |
| `src/scenes/` | Màn hình chính: tải, menu, tạo nhân vật, bản đồ, kết quả, phụ huynh. |
| `src/minigames/` | Mỗi dạng đố một file, đều kế thừa `BaseMinigame`. |
| `src/data/grade1.json` | Nội dung Lớp 1: trạm, câu hỏi, từ vựng, tranh tô màu. |

## Con đường phiêu lưu

Bản đồ chính của mỗi đảo là một con đường **18 chặng** (`JourneyScene`). Phần đảo phía trước bị mây che; bé phải đạt **2 sao** ở một chặng mới mở được chặng sau.

Dữ liệu nằm ở mục `journey` trong file đảo (`regions` = tên vùng, `stops` = danh sách chặng). Loại chặng (`kind`):

| kind | Ý nghĩa | Trường dữ liệu |
|---|---|---|
| `play` | Một đề bài | `subject` (id môn), `tier` (0–5) |
| `story` | Giúp nhân vật phụ; qua chặng thì bạn đó đi theo bé | thêm `npc` (ảnh), `npcName`, `story` (các câu thoại), `thanks` |
| `chest` | Rương báu, mở là qua | `reward.acc` (phụ kiện) |
| `rest` | Trạm nghỉ, đi qua là qua; có thể chơi thư giãn | `name`, `options` (môn + cấp) |
| `gate` | Cổng thử thách: trận boss nhỏ dùng câu hỏi của Boss đảo | `name`, `hp`, `intro`, `outro` |
| `boss` | Boss cuối đảo; thắng thì mở đảo kế tiếp | — |

- Trượt một chặng 2 lần liên tiếp thì lần sau đề dễ hơn một cấp (`isEasier` trong `src/core/Journey.js`).
- Tiến độ lưu ở `Save.journey(islandId)`: `reached` (chặng xa nhất), `stars`, `fails`, `followers`, `done`.
- **Sân luyện tập** (`MapScene`, nút "Luyện tập"): chỉ mở các trò bé đã gặp trên đường; các cấp đã gặp mở sẵn, cấp cao hơn mở khi cấp trước có sao.

## Cấp độ

Mỗi môn có 6 cấp: Rất dễ → Dễ → Bình thường → Khó → Rất khó → Siêu khó. Cấp "Rất dễ" mở sẵn, cấp sau mở khi cấp trước có ít nhất 1 sao. Boss mở khi đủ `requiredStars` sao.

Trong `grade1.json`, mỗi môn có `base` (cấu hình chung) và `tiers` (6 phần ghi đè cho từng cấp). Cấu hình cuối của một cấp = `base` + `tiers[k]`; vì vậy đừng đặt trùng tên khoá ở hai nơi nếu kiểu dữ liệu khác nhau (ví dụ Tiếng Anh dùng `vocab` là danh sách từ ở `base`, còn `vocabSize` là số lượng ở `tiers`).

## Âm thanh

- Hiệu ứng và nhạc nền bật/tắt riêng (nút ở menu, bản đồ và khu phụ huynh). Nhạc nền được tổng hợp bằng Web Audio trong `src/core/AudioManager.js`, tự tạm dừng ở màn Nhảy.
- Khi bé trả lời sai, chú cún cười lăn ngang màn hình (`laughingDog` trong `src/ui/helpers.js`). Màn Nhảy không gọi cún khi trượt nhịp.

## Các đảo

| Đảo | Trình độ | File | Boss | Mở khoá |
|---|---|---|---|---|
| Đảo Dâu Tây | lớp 1 | `src/data/grade1.json` | Quái Mây Đen | Mở sẵn |
| Đảo Hướng Dương | lớp 2 | `src/data/grade2.json` | Quái Gió Xoáy | Đi hết Đảo Dâu Tây |
| Đảo San Hô | lớp 3 | `src/data/grade3.json` | Mực Khổng Lồ | Đi hết Đảo Hướng Dương |
| Đảo Nấm Thần | lớp 4 | `src/data/grade4.json` | Vua Nấm Cáu Kỉnh | Đi hết Đảo San Hô |
| Đảo Mây | lớp 5 | `src/data/grade5.json` | Rồng Sấm Sét | Đi hết Đảo Nấm Thần |

Tên đảo không ghi lớp; trình độ chỉ dùng trong dữ liệu (`grade`).

Toán lớp 3–5 dùng các dạng trong `UPPER_KINDS` (`src/core/QuestionGenerator.js`): `mulBig`, `divBig`, `perimeter`, `mul2`, `avg`, `fracAdd`, `fracSub`, `fracOf`, `decAdd`, `decSub`, `decMul10`, `percent`, `area`, `speed`. Số thập phân viết bằng dấu phẩy (2,5). Boss đảo 3–5 dùng câu hỏi `math` (theo `config.math`) và `pair` (theo `config.pairs`).

Trò nối cặp (`match`) dùng được cho tiếng Việt: đặt `prompt` và `lang: "vi-VN"`, mỗi mục `{ "label": vế trái, "word": vế phải }`.

Bản đồ thế giới (`WorldScene`) hiện các đảo theo thứ tự trong `ISLAND_FILES` (`src/scenes/BootScene.js`). Boss của mỗi đảo chỉ tính sao của chính đảo đó.

Đảo 2 có thêm 2 trò: **Xem đồng hồ** (`ClockGame`, đồng hồ vẽ trong `src/ui/Clock.js`) và **Mê cung số** (`MazeGame`). Ghép chữ có thêm chế độ `fill` (điền âm đầu / vần) và `sentence` (xếp câu); Tìm quy luật có `mode: "number"` (dãy số).

### Các trò giải đố không phải trắc nghiệm

| Trò | File | Đảo | Ghi chú |
|---|---|---|---|
| Lật thẻ trí nhớ | `MemoryGame.js` | 1 | `mode`: same / word / english / math; `peek` = số ms cho xem trước |
| Phân loại vào giỏ | `SortGame.js` | 1 | nhóm có sẵn trong `groups`, hoặc `rule`: parity / compare / exprParity |
| Cân thăng bằng | `BalanceGame.js` | 2 | `left`: single / sum2 / mul; `unique` = chọn đúng 2 quả; `given` + `maxBlocks` cho cấp siêu khó |
| Lập trình robot | `CodeGame.js` | 2 | bấm cùng mũi tên để gộp "×n"; số lệnh tối đa = số lần rẽ ít nhất + `slack`; `minRuns` bắt đường đi phải rẽ nhiều |

| Ghép hình Tangram | `TangramGame.js` | 3, 5 | `figures` (house, boat, tree, fish, cat), `hints` = viền gợi ý, `rotate` = mảnh bị xoay, `decoy` = thêm mảnh thừa |
| Sudoku | `SudokuGame.js` | 3, 4 | `size` 4 hoặc 6, `symbols` pics/num, `blanks` = số ô trống (đề luôn có đúng một lời giải) |

## Thêm đảo / lớp mới

1. Tạo `src/data/gradeN.json` cùng cấu trúc với `grade2.json` (gồm `bg`, `tree`, `world`, `icon`, `unlock`) và thêm id vào `ISLAND_FILES`.
2. Mỗi môn có `type` trùng key của một mini-game (`math`, `clock`, `word`, `pattern`, `maze`, `match`, `color`, `dance`, `catch`) và 6 `tiers`; Boss nằm ở mục `boss` (ảnh boss đặt ở `config.art`).
3. Dạng đố mới: tạo file trong `src/minigames/` kế thừa `BaseMinigame`, đăng ký trong `src/main.js`.
