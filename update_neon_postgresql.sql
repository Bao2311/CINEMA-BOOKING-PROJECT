-- Script cập nhật Poster và Trailer chuẩn cho Neon PostgreSQL Database
-- Copy toàn bộ nội dung này và Paste vào mục 'SQL Editor' trên Neon Console rồi bấm Run

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/iKPsC9EFUafRP9SrUznI61getVP.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=fsQgc9pCyDU',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE '%Mission: Impossible%';

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=Ox8ZLF6cGM0',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE '%Superman%';

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=jan5CFWs9ic',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE '%Jurassic World%';

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/9PXZIUsSDh4alB80jheWX4fhZmy.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=CT2_P2DZBR0',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE 'F1%';

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/53dsJ3oEnBhTBVMigWJ9tkA5bzJ.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=22w7z_lT6YM',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE '%How to Train Your Dragon%' OR "Movie_Name" ILIKE '%Luyện Rồng%';

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/fWPgbnt2LSqkQ6cdQc0SZN9CpLm.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=O98jSd24lmA',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE '%Sinners%' OR "Movie_Name" ILIKE '%Kẻ Tội Đồ%';

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=-sAOWhvheK8',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE 'Thunderbolts%';

UPDATE "Movies"
SET "Poster_URL" = 'https://image.tmdb.org/t/p/w500/bRBeSHfGHwkEpImlhxPmOcUsaeg.jpg',
    "Trailer_Link" = 'https://www.youtube.com/watch?v=ITmRYfeg4H0',
    "Updated_At" = NOW()
WHERE "Movie_Name" ILIKE 'Avatar%';
