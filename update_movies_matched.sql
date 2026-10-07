USE CinemaDB_Local;
GO

BEGIN TRANSACTION;

-- 18: Mission: Impossible – Tối Hậu Thư
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/iKPsC9EFUafRP9SrUznI61getVP.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=fsQgc9pCyDU',
    Updated_At = GETDATE()
WHERE Movie_ID = 18;

-- 19: Thunderbolts*
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=-sAOWhvheK8',
    Updated_At = GETDATE()
WHERE Movie_ID = 19;

-- 20: Materialists
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/eDo0pNruy0Qgj6BdTyHIR4cxHY8.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=9gjeXsTsxqY',
    Updated_At = GETDATE()
WHERE Movie_ID = 20;

-- 21: Jurassic World: Tái Sinh
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=jan5CFWs9ic',
    Updated_At = GETDATE()
WHERE Movie_ID = 21;

-- 22: F1: Tốc Độ Huyền Thoại
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/9PXZIUsSDh4alB80jheWX4fhZmy.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=CT2_P2DZBR0',
    Updated_At = GETDATE()
WHERE Movie_ID = 22;

-- 23: Bí Kíp Luyện Rồng: Live Action
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/53dsJ3oEnBhTBVMigWJ9tkA5bzJ.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=22w7z_lT6YM',
    Updated_At = GETDATE()
WHERE Movie_ID = 23;

-- 24: Điểm Đến Cuối Cùng: Huyết Thống
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/6WxhEvFsauuACfv8HyoVX6mZKFj.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=xitSoRbHJ50',
    Updated_At = GETDATE()
WHERE Movie_ID = 24;

-- 25: Kẻ Tội Đồ (Sinners)
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/fWPgbnt2LSqkQ6cdQc0SZN9CpLm.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=O98jSd24lmA',
    Updated_At = GETDATE()
WHERE Movie_ID = 25;

-- 26: Superman
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=Ox8ZLF6cGM0',
    Updated_At = GETDATE()
WHERE Movie_ID = 26;

-- 27: Vũ Nữ Sát Thủ (Ballerina)
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/2VUmvqsHb6cEtdfscEA6fqqVzLg.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=0FSwsrFpkbw',
    Updated_At = GETDATE()
WHERE Movie_ID = 27;

-- 28: Avatar: Lửa và Tro (Avatar: Fire and Ash)
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/bRBeSHfGHwkEpImlhxPmOcUsaeg.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=ITmRYfeg4H0',
    Updated_At = GETDATE()
WHERE Movie_ID = 28;

-- 29: Black Panther: Chiến Dịch Mới
UPDATE Movies
SET Poster_URL = 'https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg',
    Trailer_Link = 'https://www.youtube.com/watch?v=_Z3QKkl1WyM',
    Updated_At = GETDATE()
WHERE Movie_ID = 29;

COMMIT TRANSACTION;
GO
