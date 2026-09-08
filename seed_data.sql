SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON;

-- =============================================
-- CLEAN OLD SEED DATA
-- =============================================
DELETE FROM Seats;
DELETE FROM Showtimes;
DELETE FROM Seat_Layout;
DELETE FROM Movies;
DELETE FROM Cinema_Rooms;
DELETE FROM Ticket_Pricing;
DELETE FROM Promotions;

DBCC CHECKIDENT ('Movies', RESEED, 0);
DBCC CHECKIDENT ('Cinema_Rooms', RESEED, 0);
DBCC CHECKIDENT ('Showtimes', RESEED, 0);
DBCC CHECKIDENT ('Seat_Layout', RESEED, 0);
DBCC CHECKIDENT ('Ticket_Pricing', RESEED, 0);
DBCC CHECKIDENT ('Promotions', RESEED, 0);

-- =============================================
-- CINEMA ROOMS
-- =============================================
INSERT INTO Cinema_Rooms (Room_Name, Seat_Quantity, Room_Type, Status, Notes) VALUES
(N'Phòng 1 - Standard',   120, 'Standard', 'Active', N'Phòng chiếu tiêu chuẩn'),
(N'Phòng 2 - VIP',         80, 'VIP',      'Active', N'Phòng chiếu VIP'),
(N'Phòng 3 - IMAX',       150, 'IMAX',     'Active', N'Phòng chiếu IMAX');

-- =============================================
-- SEAT LAYOUT - Room 1 Standard (10 rows x 12 cols)
-- =============================================
DECLARE @r1 CHAR(1), @c1 INT;
DECLARE cr1 CURSOR FOR SELECT v FROM (VALUES('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H'),('I'),('J')) t(v);
OPEN cr1; FETCH NEXT FROM cr1 INTO @r1;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @c1 = 1;
    WHILE @c1 <= 12
    BEGIN
        INSERT INTO Seat_Layout (Cinema_Room_ID, Row_Label, Column_Number, Seat_Type, Is_Active)
        VALUES (1, @r1, @c1, CASE WHEN @r1 IN ('H','I','J') THEN 'VIP' ELSE 'Normal' END, 1);
        SET @c1 += 1;
    END
    FETCH NEXT FROM cr1 INTO @r1;
END
CLOSE cr1; DEALLOCATE cr1;

-- Room 2 VIP (8 rows x 10 cols)
DECLARE @r2 CHAR(1), @c2 INT;
DECLARE cr2 CURSOR FOR SELECT v FROM (VALUES('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H')) t(v);
OPEN cr2; FETCH NEXT FROM cr2 INTO @r2;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @c2 = 1;
    WHILE @c2 <= 10
    BEGIN
        INSERT INTO Seat_Layout (Cinema_Room_ID, Row_Label, Column_Number, Seat_Type, Is_Active)
        VALUES (2, @r2, @c2, 'VIP', 1);
        SET @c2 += 1;
    END
    FETCH NEXT FROM cr2 INTO @r2;
END
CLOSE cr2; DEALLOCATE cr2;

-- Room 3 IMAX (10 rows x 15 cols)
DECLARE @r3 CHAR(1), @c3 INT;
DECLARE cr3 CURSOR FOR SELECT v FROM (VALUES('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H'),('I'),('J')) t(v);
OPEN cr3; FETCH NEXT FROM cr3 INTO @r3;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @c3 = 1;
    WHILE @c3 <= 15
    BEGIN
        INSERT INTO Seat_Layout (Cinema_Room_ID, Row_Label, Column_Number, Seat_Type, Is_Active)
        VALUES (3, @r3, @c3, CASE WHEN @r3 IN ('H','I','J') THEN 'VIP' ELSE 'Normal' END, 1);
        SET @c3 += 1;
    END
    FETCH NEXT FROM cr3 INTO @r3;
END
CLOSE cr3; DEALLOCATE cr3;

-- =============================================
-- TICKET PRICING
-- =============================================
INSERT INTO Ticket_Pricing (Room_Type, Seat_Type, Base_Price, Status, Created_Date) VALUES
('Standard', 'Normal', 75000,  'Active', GETDATE()),
('Standard', 'VIP',   100000,  'Active', GETDATE()),
('VIP',      'Normal',120000,  'Active', GETDATE()),
('VIP',      'VIP',   150000,  'Active', GETDATE()),
('IMAX',     'Normal',130000,  'Active', GETDATE()),
('IMAX',     'VIP',   160000,  'Active', GETDATE());

-- =============================================
-- MOVIES (real 2025-2026 films, correct poster from TMDB)
-- =============================================
INSERT INTO Movies (Movie_Name, Release_Date, End_Date, Production_Company, Director, Cast, Duration, Genre, Rating, Language, Country, Synopsis, Poster_URL, Trailer_Link, Status, Created_By, Created_At, Updated_At) VALUES

(N'Avengers: Doomsday',
 '2026-05-01','2026-10-31',N'Marvel Studios',N'Anthony Russo, Joe Russo',
 N'Robert Downey Jr., Chris Evans, Scarlett Johansson, Benedict Cumberbatch',
 149,N'Action, Sci-Fi','PG-13',N'English',N'USA',
 N'Doctor Doom threatens to collapse all of reality. The Avengers must assemble one final time to stop him.',
 'https://image.tmdb.org/t/p/w500/j6BLmRMkfU2bEGqn6DVBxD2sLFM.jpg',
 'https://www.youtube.com/watch?v=C-3F1IGTX1E',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'Mission: Impossible – The Final Reckoning',
 '2025-05-22','2026-09-30',N'Paramount Pictures',N'Christopher McQuarrie',
 N'Tom Cruise, Hayley Atwell, Ving Rhames, Angela Bassett, Henry Czerny',
 169,N'Action, Thriller','PG-13',N'English',N'USA',
 N'Ethan Hunt and the IMF face their deadliest mission yet against a rogue AI that controls the world''s nuclear arsenals.',
 'https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcvaI3jWMnMkOp4I.jpg',
 'https://www.youtube.com/watch?v=avz06PDqDbM',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'Superman',
 '2025-07-11','2026-09-30',N'DC Studios / Warner Bros.',N'James Gunn',
 N'David Corenswet, Rachel Brosnahan, Nicholas Hoult, Edi Gathegi',
 129,N'Action, Sci-Fi, Adventure','PG-13',N'English',N'USA',
 N'Clark Kent balances his life as a reporter and as Superman, Earth''s greatest hero, facing an alien threat.',
 'https://image.tmdb.org/t/p/w500/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
 'https://www.youtube.com/watch?v=2vjCDx5oqgA',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'The Fantastic Four: First Steps',
 '2025-07-25','2026-09-30',N'Marvel Studios',N'Matt Shakman',
 N'Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach, Julia Garner',
 125,N'Action, Sci-Fi, Adventure','PG-13',N'English',N'USA',
 N'Marvel''s First Family is thrust into a perilous adventure in a retro-futuristic 1960s universe.',
 'https://image.tmdb.org/t/p/w500/9n2tJBplPbgR2ca05hS5CKXwP2c.jpg',
 'https://www.youtube.com/watch?v=v36qxfLNrPg',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'Jurassic World Rebirth',
 '2025-07-02','2026-09-30',N'Universal Pictures',N'Gareth Edwards',
 N'Scarlett Johansson, Jonathan Bailey, Mahershala Ali, Manuel Garcia-Rulfo',
 119,N'Action, Adventure, Sci-Fi','PG-13',N'English',N'USA',
 N'A team ventures to a remote island to obtain dinosaur DNA with the power to save human lives.',
 'https://image.tmdb.org/t/p/w500/vIeu8WysZrTSFb2uhPViKjX0Wjl.jpg',
 'https://www.youtube.com/watch?v=wBqJdFGLEsk',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'F1',
 '2025-06-25','2026-09-30',N'Apple Original Films / Warner Bros.',N'Joseph Kosinski',
 N'Brad Pitt, Damson Idris, Kerry Condon, Javier Bardem',
 144,N'Action, Drama, Sport','PG-13',N'English',N'USA',
 N'A retired Formula 1 driver comes back to the track to mentor a talented young rookie.',
 'https://image.tmdb.org/t/p/w500/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg',
 'https://www.youtube.com/watch?v=yqAX7l3OAag',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'How to Train Your Dragon',
 '2025-06-13','2026-09-30',N'Universal Pictures / DreamWorks',N'Dean DeBlois',
 N'Mason Thames, Nico Parker, Gerard Butler, Cate Blanchett',
 124,N'Adventure, Fantasy, Family','PG',N'English',N'USA',
 N'A young Viking befriends a dragon and must fight to protect him from his own tribe.',
 'https://image.tmdb.org/t/p/w500/q2AY61gMgXebrNmKOhbBdCkKBVh.jpg',
 'https://www.youtube.com/watch?v=_LWW7_Cxe9E',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'Lilo & Stitch',
 '2025-05-23','2026-09-30',N'Walt Disney Pictures',N'Dean Fleischer Camp',
 N'Maia Kealoha, Sydney Agudong, Zach Galifianakis, Chris Sanders',
 108,N'Comedy, Family, Sci-Fi','PG',N'English',N'USA',
 N'A lonely Hawaiian girl befriends an alien experiment that has escaped from space.',
 'https://image.tmdb.org/t/p/w500/dRGeQFXwKSWfANSNFDvRIKC0iNr.jpg',
 'https://www.youtube.com/watch?v=fbtObXe4kXs',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'Sinners',
 '2025-04-18','2026-09-30',N'Warner Bros. Pictures',N'Ryan Coogler',
 N'Michael B. Jordan, Hailee Steinfeld, Jack O''Connell, Wunmi Mosaku',
 137,N'Horror, Thriller, Drama','R',N'English',N'USA',
 N'Twin brothers trying to leave their troubled lives behind find a Mississippi town infested with an evil threat.',
 'https://image.tmdb.org/t/p/w500/wAOv3HWMn20HGT4xZzE1qQfCCrg.jpg',
 'https://www.youtube.com/watch?v=TaJHGYyGPsM',
 'NowShowing',1,GETDATE(),GETDATE()),

(N'Thunderbolts*',
 '2025-05-02','2026-09-30',N'Marvel Studios',N'Jake Schreier',
 N'Florence Pugh, Sebastian Stan, David Harbour, Wyatt Russell, Julia Louis-Dreyfus',
 127,N'Action, Adventure, Superhero','PG-13',N'English',N'USA',
 N'A team of antiheroes assembled by the government must stop a threat more dangerous than any of them.',
 'https://image.tmdb.org/t/p/w500/m9EtP1Yrzv6v7dMaC9mRaGhd1um.jpg',
 'https://www.youtube.com/watch?v=UHmJFKKrXFo',
 'NowShowing',1,GETDATE(),GETDATE()),

-- ComingSoon
(N'Zootopia 2',
 '2025-11-26','2027-02-28',N'Walt Disney Animation Studios',N'Byron Howard, Rich Moore',
 N'Ginnifer Goodwin, Jason Bateman, Idris Elba, Jenny Slate',
 108,N'Animation, Comedy, Adventure','PG',N'English',N'USA',
 N'Judy Hopps and Nick Wilde return for a brand-new adventure as Zootopia faces an unexpected new crisis.',
 'https://image.tmdb.org/t/p/w500/t3j5gSbZPW2p6IwlMo1OWKb8LiP.jpg',
 'https://www.youtube.com/watch?v=example_zootopia2',
 'ComingSoon',1,GETDATE(),GETDATE()),

(N'Avatar: Fire and Ash',
 '2025-12-19','2027-03-31',N'20th Century Studios / Lightstorm',N'James Cameron',
 N'Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang',
 180,N'Action, Sci-Fi, Adventure','PG-13',N'English',N'USA',
 N'Jake Sully and Neytiri face an even greater threat to Pandora in this breathtaking third chapter.',
 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
 'https://www.youtube.com/watch?v=example_avatar3',
 'ComingSoon',1,GETDATE(),GETDATE()),

(N'Captain America: Brave New World',
 '2025-02-14','2026-09-30',N'Marvel Studios',N'Julius Onah',
 N'Anthony Mackie, Harrison Ford, Danny Ramirez, Liv Tyler',
 118,N'Action, Superhero, Adventure','PG-13',N'English',N'USA',
 N'Sam Wilson takes on the mantle of Captain America and faces a global conspiracy involving the Red Hulk.',
 'https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
 'https://www.youtube.com/watch?v=q27Y5Yk0ER8',
 'NowShowing',1,GETDATE(),GETDATE());

-- =============================================
-- PROMOTIONS
-- =============================================
INSERT INTO Promotions (Title, Promotion_Code, Start_Date, End_Date, Discount_Type, Discount_Value, Minimum_Purchase, Maximum_Discount, Applicable_For, Usage_Limit, Current_Usage, Status, Promotion_Detail, Created_By, Created_At) VALUES
(N'Chào mừng tháng 9', 'THANG9', '2026-09-01','2026-09-30','Percentage',10,150000,50000,N'All',500,0,'Active',N'Giảm 10% cho tất cả đơn hàng từ 150,000đ trong tháng 9',1,GETDATE()),
(N'Thứ 4 vui vẻ',       'WED50K', '2026-08-26','2026-10-31','Fixed',50000,200000,50000,N'All',1000,0,'Active',N'Giảm 50,000đ mỗi thứ 4 hàng tuần',1,GETDATE()),
(N'VIP Member',         'VIP20',  '2026-08-26','2026-12-31','Percentage',20,100000,100000,N'VIP',200,0,'Active',N'Ưu đãi 20% dành riêng cho thành viên VIP',1,GETDATE());

-- =============================================
-- SHOWTIMES - Generate for 35 days
-- Schedule per day:
--   Room 1 (Standard): Movie 1 09:00, Movie 5 13:30, Movie 7 17:00, Movie 8 21:00
--   Room 2 (VIP):      Movie 2 10:00, Movie 6 14:30, Movie 10 19:00
--   Room 3 (IMAX):     Movie 3 10:30, Movie 4 15:00, Movie 1 19:30
-- =============================================
DECLARE @day INT = 0;
DECLARE @startDate DATE = CAST(GETDATE() AS DATE);

WHILE @day < 35
BEGIN
    DECLARE @d DATE = DATEADD(day, @day, @startDate);

    -- Room 1 Standard
    INSERT INTO Showtimes (Movie_ID,Cinema_Room_ID,Show_Date,Start_Time,End_Time,Price_Tier,Base_Price,Status,Capacity_Available,Created_By,Created_At,Updated_At) VALUES
    (1, 1,@d,'09:00:00','11:29:00','Standard',75000,'Active',120,1,GETDATE(),GETDATE()),
    (5, 1,@d,'13:30:00','15:29:00','Standard',75000,'Active',120,1,GETDATE(),GETDATE()),
    (7, 1,@d,'17:00:00','19:04:00','Standard',75000,'Active',120,1,GETDATE(),GETDATE()),
    (8, 1,@d,'21:00:00','22:48:00','Standard',75000,'Active',120,1,GETDATE(),GETDATE()),

    -- Room 2 VIP
    (2, 2,@d,'10:00:00','12:49:00','VIP',120000,'Active',80,1,GETDATE(),GETDATE()),
    (6, 2,@d,'14:30:00','16:54:00','VIP',120000,'Active',80,1,GETDATE(),GETDATE()),
    (10,2,@d,'19:00:00','21:07:00','VIP',120000,'Active',80,1,GETDATE(),GETDATE()),

    -- Room 3 IMAX
    (3, 3,@d,'10:30:00','12:39:00','IMAX',130000,'Active',150,1,GETDATE(),GETDATE()),
    (4, 3,@d,'15:00:00','17:05:00','IMAX',130000,'Active',150,1,GETDATE(),GETDATE()),
    (1, 3,@d,'19:30:00','21:59:00','IMAX',130000,'Active',150,1,GETDATE(),GETDATE());

    -- Weekend extra shows (Fri=6, Sat=7, Sun=1)
    IF DATEPART(WEEKDAY, @d) IN (1,6,7)
    BEGIN
        INSERT INTO Showtimes (Movie_ID,Cinema_Room_ID,Show_Date,Start_Time,End_Time,Price_Tier,Base_Price,Status,Capacity_Available,Created_By,Created_At,Updated_At) VALUES
        (9, 1,@d,'11:30:00','13:47:00','Standard',75000,'Active',120,1,GETDATE(),GETDATE()),
        (13,2,@d,'11:00:00','12:58:00','VIP',120000,'Active',80,1,GETDATE(),GETDATE()),
        (2, 3,@d,'13:00:00','15:49:00','IMAX',130000,'Active',150,1,GETDATE(),GETDATE());
    END

    SET @day += 1;
END

-- Summary
SELECT 'Movies'      AS [Table], COUNT(*) AS [Count] FROM Movies
UNION ALL SELECT 'Cinema_Rooms', COUNT(*) FROM Cinema_Rooms
UNION ALL SELECT 'Seat_Layout',  COUNT(*) FROM Seat_Layout
UNION ALL SELECT 'Ticket_Pricing',COUNT(*) FROM Ticket_Pricing
UNION ALL SELECT 'Showtimes',    COUNT(*) FROM Showtimes
UNION ALL SELECT 'Promotions',   COUNT(*) FROM Promotions;
