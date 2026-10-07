-- ==============================================================================
-- SCRIPT SEED TOÀN BỘ DATA CHUẨN LÊN NEON CLOUD DATABASE (POSTGRESQL)
-- Hướng dẫn:
-- 1. Vào Neon Console (https://console.neon.tech) -> Chọn Project của bạn.
-- 2. Chọn mục 'SQL Editor' ở thanh menu bên trái.
-- 3. Copy toàn bộ nội dung file này, Paste vào SQL Editor và nhấn 'Run'.
-- ==============================================================================

BEGIN;

-- 1. XÓA SẠCH DỮ LIỆU CŨ VÀ RESET TOÀN BỘ SEQUENCE / IDENTITY
TRUNCATE TABLE 
    "Seats",
    "Tickets",
    "Ticket_Bookings",
    "Payments",
    "Scores",
    "Booking_History",
    "Promotion_Usage",
    "Movie_Ratings",
    "Points_Redemption",
    "Points_Earning",
    "User_Points",
    "FailedLogins",
    "Showtimes",
    "Seat_Layout",
    "Movies",
    "Cinema_Rooms",
    "Ticket_Pricing",
    "Promotions",
    "Users"
RESTART IDENTITY CASCADE;

-- ==============================================================================
-- 2. SEED USERS (Mật khẩu đã được mã hóa SHA-256)
--    Admin: admin@cinema.com / Admin@123
--    Staff: staff@cinema.com / Staff@123
--    Customer: customer@cinema.com / User@123
-- ==============================================================================
INSERT INTO "Users" (
    "User_ID", "Full_Name", "Email", "Password", "Role", "Department", 
    "Hire_Date", "Date_Of_Birth", "Sex", "Phone_Number", "Address", "Account_Status", "Created_At"
) OVERRIDING SYSTEM VALUE VALUES
(
    1, 'Administrator', 'admin@cinema.com', 
    'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 
    'Admin', 'Management', NOW(), '1995-01-01', 'Male', '0901234567', 'TP. Hồ Chí Minh', 'Active', NOW()
),
(
    2, 'Cinema Staff', 'staff@cinema.com', 
    'dfd48f36338aa36228ebb9e204bba6b4e18db0b623e25c458901edc831fb18e9', 
    'Staff', 'Operations', NOW(), '1998-05-15', 'Female', '0902345678', 'TP. Hồ Chí Minh', 'Active', NOW()
),
(
    3, 'Demo Customer', 'customer@cinema.com', 
    '3e7c19576488862816f13b512cacf3e4ba97dd97243ea0bd6a2ad1642d86ba72', 
    'Customer', NULL, NULL, '2000-01-01', 'Male', '0903456789', 'TP. Hồ Chí Minh', 'Active', NOW()
);

SELECT setval(pg_get_serial_sequence('"Users"', 'User_ID'), coalesce(max("User_ID"), 1)) FROM "Users";

-- ==============================================================================
-- 3. SEED CINEMA ROOMS (3 phòng chiếu tiêu chuẩn, VIP và IMAX)
-- ==============================================================================
INSERT INTO "Cinema_Rooms" (
    "Cinema_Room_ID", "Room_Name", "Seat_Quantity", "Room_Type", "Status", "Notes"
) OVERRIDING SYSTEM VALUE VALUES
(1, 'Phòng 1 - Standard', 120, 'Standard', 'Active', 'Phòng chiếu tiêu chuẩn'),
(2, 'Phòng 2 - VIP',       80, 'VIP',      'Active', 'Phòng chiếu VIP'),
(3, 'Phòng 3 - IMAX',     150, 'IMAX',     'Active', 'Phòng chiếu IMAX');

SELECT setval(pg_get_serial_sequence('"Cinema_Rooms"', 'Cinema_Room_ID'), coalesce(max("Cinema_Room_ID"), 1)) FROM "Cinema_Rooms";

-- ==============================================================================
-- 4. SEED SEAT LAYOUT (Tự động sinh sơ đồ ghế cho cả 3 phòng)
--    Phòng 1: 10 hàng (A-J) x 12 cột = 120 ghế (H, I, J là VIP)
--    Phòng 2: 8 hàng (A-H) x 10 cột = 80 ghế VIP
--    Phòng 3: 10 hàng (A-J) x 15 cột = 150 ghế (H, I, J là VIP)
-- ==============================================================================
-- Phòng 1
INSERT INTO "Seat_Layout" ("Cinema_Room_ID", "Row_Label", "Column_Number", "Seat_Type", "Is_Active")
SELECT 1, r, c, CASE WHEN r IN ('H','I','J') THEN 'VIP' ELSE 'Normal' END, true
FROM unnest(ARRAY['A','B','C','D','E','F','G','H','I','J']) AS r
CROSS JOIN generate_series(1, 12) AS c;

-- Phòng 2
INSERT INTO "Seat_Layout" ("Cinema_Room_ID", "Row_Label", "Column_Number", "Seat_Type", "Is_Active")
SELECT 2, r, c, 'VIP', true
FROM unnest(ARRAY['A','B','C','D','E','F','G','H']) AS r
CROSS JOIN generate_series(1, 10) AS c;

-- Phòng 3
INSERT INTO "Seat_Layout" ("Cinema_Room_ID", "Row_Label", "Column_Number", "Seat_Type", "Is_Active")
SELECT 3, r, c, CASE WHEN r IN ('H','I','J') THEN 'VIP' ELSE 'Normal' END, true
FROM unnest(ARRAY['A','B','C','D','E','F','G','H','I','J']) AS r
CROSS JOIN generate_series(1, 15) AS c;

SELECT setval(pg_get_serial_sequence('"Seat_Layout"', 'Layout_ID'), coalesce(max("Layout_ID"), 1)) FROM "Seat_Layout";

-- ==============================================================================
-- 5. SEED TICKET PRICING (Bảng giá vé theo loại phòng và loại ghế)
-- ==============================================================================
INSERT INTO "Ticket_Pricing" (
    "Price_ID", "Room_Type", "Seat_Type", "Base_Price", "Status", "Created_Date"
) OVERRIDING SYSTEM VALUE VALUES
(1, 'Standard', 'Normal', 75000,  'Active', NOW()),
(2, 'Standard', 'VIP',   100000,  'Active', NOW()),
(3, 'VIP',      'Normal',120000,  'Active', NOW()),
(4, 'VIP',      'VIP',   150000,  'Active', NOW()),
(5, 'IMAX',     'Normal',130000,  'Active', NOW()),
(6, 'IMAX',     'VIP',   160000,  'Active', NOW());

SELECT setval(pg_get_serial_sequence('"Ticket_Pricing"', 'Price_ID'), coalesce(max("Price_ID"), 1)) FROM "Ticket_Pricing";

-- ==============================================================================
-- 6. SEED MOVIES (13 phim chiếu rạp chuẩn 2025-2026 với TMDB Poster & Trailer HD)
-- ==============================================================================
INSERT INTO "Movies" (
    "Movie_ID", "Movie_Name", "Release_Date", "End_Date", "Production_Company", 
    "Director", "Cast", "Duration", "Genre", "Rating", "Language", "Country", 
    "Synopsis", "Poster_URL", "Trailer_Link", "Status", "Created_By", "Created_At", "Updated_At"
) OVERRIDING SYSTEM VALUE VALUES
(
    1, 'Avengers: Doomsday', '2026-05-01', '2026-10-31', 'Marvel Studios',
    'Anthony Russo, Joe Russo', 'Robert Downey Jr., Chris Evans, Scarlett Johansson, Benedict Cumberbatch',
    149, 'Action, Sci-Fi', 'PG-13', 'English', 'USA',
    'Doctor Doom đe dọa làm sụp đổ toàn bộ đa vũ trụ. Biệt đội Avengers phải tập hợp một lần cuối cùng để ngăn chặn hắn.',
    'https://image.tmdb.org/t/p/w500/j6BLmRMkfU2bEGqn6DVBxD2sLFM.jpg',
    'https://www.youtube.com/watch?v=C-3F1IGTX1E',
    'NowShowing', 1, NOW(), NOW()
),
(
    2, 'Mission: Impossible – The Final Reckoning', '2025-05-22', '2026-09-30', 'Paramount Pictures',
    'Christopher McQuarrie', 'Tom Cruise, Hayley Atwell, Ving Rhames, Angela Bassett, Henry Czerny',
    169, 'Action, Thriller', 'PG-13', 'English', 'USA',
    'Ethan Hunt và đội IMF đối mặt với nhiệm vụ chết người nhất trước thực thể trí tuệ nhân tạo kiểm soát kho vũ khí toàn cầu.',
    'https://image.tmdb.org/t/p/w500/iKPsC9EFUafRP9SrUznI61getVP.jpg',
    'https://www.youtube.com/watch?v=fsQgc9pCyDU',
    'NowShowing', 1, NOW(), NOW()
),
(
    3, 'Superman', '2025-07-11', '2026-09-30', 'DC Studios / Warner Bros.',
    'James Gunn', 'David Corenswet, Rachel Brosnahan, Nicholas Hoult, Edi Gathegi',
    129, 'Action, Sci-Fi, Adventure', 'PG-13', 'English', 'USA',
    'Clark Kent cân bằng giữa công việc phóng viên và trách nhiệm của Superman - biểu tượng hy vọng lớn nhất của Trái Đất.',
    'https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
    'https://www.youtube.com/watch?v=Ox8ZLF6cGM0',
    'NowShowing', 1, NOW(), NOW()
),
(
    4, 'The Fantastic Four: First Steps', '2025-07-25', '2026-09-30', 'Marvel Studios',
    'Matt Shakman', 'Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach, Julia Garner',
    125, 'Action, Sci-Fi, Adventure', 'PG-13', 'English', 'USA',
    'Bộ tứ siêu đẳng bước vào chuyến phiêu lưu nguy hiểm trong bối cảnh vũ trụ retro-futuristic thập niên 1960.',
    'https://image.tmdb.org/t/p/w500/9n2tJBplPbgR2ca05hS5CKXwP2c.jpg',
    'https://www.youtube.com/watch?v=v36qxfLNrPg',
    'NowShowing', 1, NOW(), NOW()
),
(
    5, 'Jurassic World Rebirth', '2025-07-02', '2026-09-30', 'Universal Pictures',
    'Gareth Edwards', 'Scarlett Johansson, Jonathan Bailey, Mahershala Ali, Manuel Garcia-Rulfo',
    119, 'Action, Adventure, Sci-Fi', 'PG-13', 'English', 'USA',
    'Một nhóm chuyên gia mạo hiểm đến hòn đảo cô lập để thu thập ADN khủng long mang chìa khóa cứu sống nhân loại.',
    'https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg',
    'https://www.youtube.com/watch?v=jan5CFWs9ic',
    'NowShowing', 1, NOW(), NOW()
),
(
    6, 'F1', '2025-06-25', '2026-09-30', 'Apple Original Films / Warner Bros.',
    'Joseph Kosinski', 'Brad Pitt, Damson Idris, Kerry Condon, Javier Bardem',
    144, 'Action, Drama, Sport', 'PG-13', 'English', 'USA',
    'Một cựu tay đua Công thức 1 kỳ cựu tái xuất đường đua để cố vấn cho một tài năng trẻ đầy tham vọng.',
    'https://image.tmdb.org/t/p/w500/9PXZIUsSDh4alB80jheWX4fhZmy.jpg',
    'https://www.youtube.com/watch?v=CT2_P2DZBR0',
    'NowShowing', 1, NOW(), NOW()
),
(
    7, 'How to Train Your Dragon', '2025-06-13', '2026-09-30', 'Universal Pictures / DreamWorks',
    'Dean DeBlois', 'Mason Thames, Nico Parker, Gerard Butler, Cate Blanchett',
    124, 'Adventure, Fantasy, Family', 'PG', 'English', 'USA',
    'Một chàng trai trẻ người Viking kết bạn với một chú rồng bí ẩn và phải chiến đấu bảo vệ tình bạn trước bộ tộc.',
    'https://image.tmdb.org/t/p/w500/53dsJ3oEnBhTBVMigWJ9tkA5bzJ.jpg',
    'https://www.youtube.com/watch?v=22w7z_lT6YM',
    'NowShowing', 1, NOW(), NOW()
),
(
    8, 'Lilo & Stitch', '2025-05-23', '2026-09-30', 'Walt Disney Pictures',
    'Dean Fleischer Camp', 'Maia Kealoha, Sydney Agudong, Zach Galifianakis, Chris Sanders',
    108, 'Comedy, Family, Sci-Fi', 'PG', 'English', 'USA',
    'Cô bé Hawaii cô đơn kết bạn với một sinh vật ngoài hành tinh nghịch ngợm trốn thoát xuống Trái Đất.',
    'https://image.tmdb.org/t/p/w500/dRGeQFXwKSWfANSNFDvRIKC0iNr.jpg',
    'https://www.youtube.com/watch?v=fbtObXe4kXs',
    'NowShowing', 1, NOW(), NOW()
),
(
    9, 'Sinners', '2025-04-18', '2026-09-30', 'Warner Bros. Pictures',
    'Ryan Coogler', 'Michael B. Jordan, Hailee Steinfeld, Jack O''Connell, Wunmi Mosaku',
    137, 'Horror, Thriller, Drama', 'R', 'English', 'USA',
    'Hai anh em sinh đôi cố gắng gác lại quá khứ đen tối nhưng lại chạm trán một thế lực tà ác bao trùm thị trấn.',
    'https://image.tmdb.org/t/p/w500/fWPgbnt2LSqkQ6cdQc0SZN9CpLm.jpg',
    'https://www.youtube.com/watch?v=O98jSd24lmA',
    'NowShowing', 1, NOW(), NOW()
),
(
    10, 'Thunderbolts*', '2025-05-02', '2026-09-30', 'Marvel Studios',
    'Jake Schreier', 'Florence Pugh, Sebastian Stan, David Harbour, Wyatt Russell, Julia Louis-Dreyfus',
    127, 'Action, Adventure, Superhero', 'PG-13', 'English', 'USA',
    'Nhóm phản anh hùng được chính phủ tập hợp để đối phó với mối hiểm họa khôn lường.',
    'https://image.tmdb.org/t/p/w500/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg',
    'https://www.youtube.com/watch?v=-sAOWhvheK8',
    'NowShowing', 1, NOW(), NOW()
),
(
    11, 'Zootopia 2', '2025-11-26', '2027-02-28', 'Walt Disney Animation Studios',
    'Byron Howard, Rich Moore', 'Ginnifer Goodwin, Jason Bateman, Idris Elba, Jenny Slate',
    108, 'Animation, Comedy, Adventure', 'PG', 'English', 'USA',
    'Judy Hopps và Nick Wilde trở lại với cuộc phiêu lưu phá án hoàn toàn mới tại thành phố muông thú.',
    'https://image.tmdb.org/t/p/w500/t3j5gSbZPW2p6IwlMo1OWKb8LiP.jpg',
    'https://www.youtube.com/watch?v=example_zootopia2',
    'ComingSoon', 1, NOW(), NOW()
),
(
    12, 'Avatar: Fire and Ash', '2025-12-19', '2027-03-31', '20th Century Studios / Lightstorm',
    'James Cameron', 'Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang',
    180, 'Action, Sci-Fi, Adventure', 'PG-13', 'English', 'USA',
    'Jake Sully và Neytiri đối mặt với bộ tộc tro tàn và hiểm họa mới tại hành tinh Pandora tuyệt mỹ.',
    'https://image.tmdb.org/t/p/w500/bRBeSHfGHwkEpImlhxPmOcUsaeg.jpg',
    'https://www.youtube.com/watch?v=ITmRYfeg4H0',
    'ComingSoon', 1, NOW(), NOW()
),
(
    13, 'Captain America: Brave New World', '2025-02-14', '2026-09-30', 'Marvel Studios',
    'Julius Onah', 'Anthony Mackie, Harrison Ford, Danny Ramirez, Liv Tyler',
    118, 'Action, Superhero, Adventure', 'PG-13', 'English', 'USA',
    'Sam Wilson khoác lên mình danh xưng Captain America và đối mặt với âm mưu toàn cầu cùng sự xuất hiện của Red Hulk.',
    'https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
    'https://www.youtube.com/watch?v=q27Y5Yk0ER8',
    'NowShowing', 1, NOW(), NOW()
);

SELECT setval(pg_get_serial_sequence('"Movies"', 'Movie_ID'), coalesce(max("Movie_ID"), 1)) FROM "Movies";

-- ==============================================================================
-- 7. SEED PROMOTIONS (Mã khuyến mãi áp dụng thanh toán)
-- ==============================================================================
INSERT INTO "Promotions" (
    "Promotion_ID", "Title", "Promotion_Code", "Start_Date", "End_Date", 
    "Discount_Type", "Discount_Value", "Minimum_Purchase", "Maximum_Discount", 
    "Applicable_For", "Usage_Limit", "Current_Usage", "Status", "Promotion_Detail", "Created_By", "Created_At"
) OVERRIDING SYSTEM VALUE VALUES
(
    1, 'Chào mừng tháng 9', 'THANG9', '2026-09-01', '2026-10-31', 
    'Percentage', 10, 150000, 50000, 'All', 500, 0, 'Active', 
    'Giảm 10% cho tất cả đơn hàng từ 150,000đ trong tháng 9', 1, NOW()
),
(
    2, 'Thứ 4 vui vẻ', 'WED50K', '2026-08-26', '2026-12-31', 
    'Fixed', 50000, 200000, 50000, 'All', 1000, 0, 'Active', 
    'Giảm 50,000đ mỗi thứ 4 hàng tuần', 1, NOW()
),
(
    3, 'VIP Member', 'VIP20', '2026-08-26', '2026-12-31', 
    'Percentage', 20, 100000, 100000, 'VIP', 200, 0, 'Active', 
    'Ưu đãi 20% dành riêng cho thành viên VIP', 1, NOW()
);

SELECT setval(pg_get_serial_sequence('"Promotions"', 'Promotion_ID'), coalesce(max("Promotion_ID"), 1)) FROM "Promotions";

-- ==============================================================================
-- 8. SEED SHOWTIMES (Tự động sinh suất chiếu cho 35 ngày tới kể từ hôm nay)
--    Status = 'Active' chuẩn cho hệ thống đặt vé
-- ==============================================================================
INSERT INTO "Showtimes" (
    "Movie_ID", "Cinema_Room_ID", "Show_Date", "Start_Time", "End_Time", 
    "Price_Tier", "Base_Price", "Status", "Capacity_Available", "Created_By", "Created_At", "Updated_At"
)
-- Phòng 1: Standard
SELECT 1, 1, CURRENT_DATE + (d || ' days')::interval, '09:00:00'::interval, '11:29:00'::interval, 'Standard', 75000, 'Active', 120, 1, NOW(), NOW() FROM generate_series(0, 34) AS d
UNION ALL
SELECT 5, 1, CURRENT_DATE + (d || ' days')::interval, '13:30:00'::interval, '15:29:00'::interval, 'Standard', 75000, 'Active', 120, 1, NOW(), NOW() FROM generate_series(0, 34) AS d
UNION ALL
SELECT 7, 1, CURRENT_DATE + (d || ' days')::interval, '17:00:00'::interval, '19:04:00'::interval, 'Standard', 75000, 'Active', 120, 1, NOW(), NOW() FROM generate_series(0, 34) AS d
UNION ALL
SELECT 8, 1, CURRENT_DATE + (d || ' days')::interval, '21:00:00'::interval, '22:48:00'::interval, 'Standard', 75000, 'Active', 120, 1, NOW(), NOW() FROM generate_series(0, 34) AS d

-- Phòng 2: VIP
UNION ALL
SELECT 2, 2, CURRENT_DATE + (d || ' days')::interval, '10:00:00'::interval, '12:49:00'::interval, 'VIP', 120000, 'Active', 80, 1, NOW(), NOW() FROM generate_series(0, 34) AS d
UNION ALL
SELECT 6, 2, CURRENT_DATE + (d || ' days')::interval, '14:30:00'::interval, '16:54:00'::interval, 'VIP', 120000, 'Active', 80, 1, NOW(), NOW() FROM generate_series(0, 34) AS d
UNION ALL
SELECT 10,2, CURRENT_DATE + (d || ' days')::interval, '19:00:00'::interval, '21:07:00'::interval, 'VIP', 120000, 'Active', 80, 1, NOW(), NOW() FROM generate_series(0, 34) AS d

-- Phòng 3: IMAX
UNION ALL
SELECT 3, 3, CURRENT_DATE + (d || ' days')::interval, '10:30:00'::interval, '12:39:00'::interval, 'IMAX', 130000, 'Active', 150, 1, NOW(), NOW() FROM generate_series(0, 34) AS d
UNION ALL
SELECT 4, 3, CURRENT_DATE + (d || ' days')::interval, '15:00:00'::interval, '17:05:00'::interval, 'IMAX', 130000, 'Active', 150, 1, NOW(), NOW() FROM generate_series(0, 34) AS d
UNION ALL
SELECT 1, 3, CURRENT_DATE + (d || ' days')::interval, '19:30:00'::interval, '21:59:00'::interval, 'IMAX', 130000, 'Active', 150, 1, NOW(), NOW() FROM generate_series(0, 34) AS d

-- Suất chiếu bổ sung cuối tuần (Thứ 6, Thứ 7, Chủ Nhật)
UNION ALL
SELECT 9, 1, CURRENT_DATE + (d || ' days')::interval, '11:30:00'::interval, '13:47:00'::interval, 'Standard', 75000, 'Active', 120, 1, NOW(), NOW() 
FROM generate_series(0, 34) AS d 
WHERE EXTRACT(DOW FROM (CURRENT_DATE + (d || ' days')::interval)) IN (0, 5, 6)
UNION ALL
SELECT 13, 2, CURRENT_DATE + (d || ' days')::interval, '11:00:00'::interval, '12:58:00'::interval, 'VIP', 120000, 'Active', 80, 1, NOW(), NOW() 
FROM generate_series(0, 34) AS d 
WHERE EXTRACT(DOW FROM (CURRENT_DATE + (d || ' days')::interval)) IN (0, 5, 6)
UNION ALL
SELECT 2, 3, CURRENT_DATE + (d || ' days')::interval, '13:00:00'::interval, '15:49:00'::interval, 'IMAX', 130000, 'Active', 150, 1, NOW(), NOW() 
FROM generate_series(0, 34) AS d 
WHERE EXTRACT(DOW FROM (CURRENT_DATE + (d || ' days')::interval)) IN (0, 5, 6);

SELECT setval(pg_get_serial_sequence('"Showtimes"', 'Showtime_ID'), coalesce(max("Showtime_ID"), 1)) FROM "Showtimes";

COMMIT;

-- ==============================================================================
-- 9. KIỂM TRA TỔNG HỢP SỐ LƯỢNG DỮ LIỆU ĐÃ NẠP
-- ==============================================================================
SELECT 'Users'          AS "Table", COUNT(*) AS "Total" FROM "Users"
UNION ALL SELECT 'Cinema_Rooms',   COUNT(*) FROM "Cinema_Rooms"
UNION ALL SELECT 'Seat_Layout',    COUNT(*) FROM "Seat_Layout"
UNION ALL SELECT 'Ticket_Pricing', COUNT(*) FROM "Ticket_Pricing"
UNION ALL SELECT 'Movies',         COUNT(*) FROM "Movies"
UNION ALL SELECT 'Promotions',     COUNT(*) FROM "Promotions"
UNION ALL SELECT 'Showtimes',      COUNT(*) FROM "Showtimes";
