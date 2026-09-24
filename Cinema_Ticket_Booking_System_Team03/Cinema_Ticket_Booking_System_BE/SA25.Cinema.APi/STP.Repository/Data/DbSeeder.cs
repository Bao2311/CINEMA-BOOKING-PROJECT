using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using STP.Repository.Models;

namespace STP.Repository.Data
{
    public static class DbSeeder
    {
        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = Encoding.UTF8.GetBytes(password);
            byte[] hash = sha256.ComputeHash(bytes);
            var sb = new StringBuilder();
            for (int i = 0; i < hash.Length; i++)
            {
                sb.Append(hash[i].ToString("x2"));
            }
            return sb.ToString();
        }

        private static DateTime ToUtc(DateTime dt) => DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        public static async Task SeedAsync(CinemaDbContext context)
        {
            var nowUtc = DateTime.UtcNow;

            // 1. Seed Users (if none exist)
            if (!await context.Users.AnyAsync())
            {
                var users = new List<User>
                {
                    new User
                    {
                        Full_Name = "Administrator",
                        Email = "admin@cinema.com",
                        Password = HashPassword("Admin@123"),
                        Role = "Admin",
                        Phone_Number = "0901234567",
                        Account_Status = "Active",
                        Created_At = nowUtc
                    },
                    new User
                    {
                        Full_Name = "Cinema Staff",
                        Email = "staff@cinema.com",
                        Password = HashPassword("Staff@123"),
                        Role = "Staff",
                        Phone_Number = "0902345678",
                        Department = "Operations",
                        Hire_Date = nowUtc,
                        Account_Status = "Active",
                        Created_At = nowUtc
                    },
                    new User
                    {
                        Full_Name = "Demo Customer",
                        Email = "customer@cinema.com",
                        Password = HashPassword("User@123"),
                        Role = "Customer",
                        Phone_Number = "0903456789",
                        Account_Status = "Active",
                        Created_At = nowUtc
                    }
                };
                await context.Users.AddRangeAsync(users);
                await context.SaveChangesAsync();
            }

            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == "Admin") 
                            ?? await context.Users.FirstAsync();
            int adminId = adminUser.User_ID;

            // 2. Seed Cinema Rooms
            if (!await context.CinemaRooms.AnyAsync())
            {
                var rooms = new List<CinemaRoom>
                {
                    new CinemaRoom { Room_Name = "Phòng 1 - Standard", Seat_Quantity = 120, Room_Type = "Standard", Status = "Active", Notes = "Phòng chiếu tiêu chuẩn" },
                    new CinemaRoom { Room_Name = "Phòng 2 - VIP", Seat_Quantity = 80, Room_Type = "VIP", Status = "Active", Notes = "Phòng chiếu VIP" },
                    new CinemaRoom { Room_Name = "Phòng 3 - IMAX", Seat_Quantity = 150, Room_Type = "IMAX", Status = "Active", Notes = "Phòng chiếu IMAX" }
                };
                await context.CinemaRooms.AddRangeAsync(rooms);
                await context.SaveChangesAsync();
            }

            var roomList = await context.CinemaRooms.OrderBy(r => r.Cinema_Room_ID).ToListAsync();
            int room1Id = roomList[0].Cinema_Room_ID;
            int room2Id = roomList.Count > 1 ? roomList[1].Cinema_Room_ID : room1Id;
            int room3Id = roomList.Count > 2 ? roomList[2].Cinema_Room_ID : room1Id;

            // 3. Seed Seat Layout
            if (!await context.SeatLayouts.AnyAsync())
            {
                var layouts = new List<SeatLayout>();

                // Room 1 Standard (10 rows A-J, 12 cols)
                char[] r1Rows = { 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J' };
                foreach (var row in r1Rows)
                {
                    for (int col = 1; col <= 12; col++)
                    {
                        layouts.Add(new SeatLayout
                        {
                            Cinema_Room_ID = room1Id,
                            Row_Label = row.ToString(),
                            Column_Number = col,
                            Seat_Type = (row == 'H' || row == 'I' || row == 'J') ? "VIP" : "Normal",
                            Is_Active = true
                        });
                    }
                }

                // Room 2 VIP (8 rows A-H, 10 cols)
                char[] r2Rows = { 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H' };
                foreach (var row in r2Rows)
                {
                    for (int col = 1; col <= 10; col++)
                    {
                        layouts.Add(new SeatLayout
                        {
                            Cinema_Room_ID = room2Id,
                            Row_Label = row.ToString(),
                            Column_Number = col,
                            Seat_Type = "VIP",
                            Is_Active = true
                        });
                    }
                }

                // Room 3 IMAX (10 rows A-J, 15 cols)
                char[] r3Rows = { 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J' };
                foreach (var row in r3Rows)
                {
                    for (int col = 1; col <= 15; col++)
                    {
                        layouts.Add(new SeatLayout
                        {
                            Cinema_Room_ID = room3Id,
                            Row_Label = row.ToString(),
                            Column_Number = col,
                            Seat_Type = (row == 'H' || row == 'I' || row == 'J') ? "VIP" : "Normal",
                            Is_Active = true
                        });
                    }
                }

                await context.SeatLayouts.AddRangeAsync(layouts);
                await context.SaveChangesAsync();
            }

            // 4. Seed Ticket Pricing
            if (!await context.TicketPricings.AnyAsync())
            {
                var pricings = new List<TicketPricing>
                {
                    new TicketPricing { Room_Type = "Standard", Seat_Type = "Normal", Base_Price = 75000, Status = "Active", Created_Date = nowUtc },
                    new TicketPricing { Room_Type = "Standard", Seat_Type = "VIP", Base_Price = 100000, Status = "Active", Created_Date = nowUtc },
                    new TicketPricing { Room_Type = "VIP", Seat_Type = "Normal", Base_Price = 120000, Status = "Active", Created_Date = nowUtc },
                    new TicketPricing { Room_Type = "VIP", Seat_Type = "VIP", Base_Price = 150000, Status = "Active", Created_Date = nowUtc },
                    new TicketPricing { Room_Type = "IMAX", Seat_Type = "Normal", Base_Price = 130000, Status = "Active", Created_Date = nowUtc },
                    new TicketPricing { Room_Type = "IMAX", Seat_Type = "VIP", Base_Price = 160000, Status = "Active", Created_Date = nowUtc }
                };
                await context.TicketPricings.AddRangeAsync(pricings);
                await context.SaveChangesAsync();
            }

            // 5. Seed Movies
            if (!await context.Movies.AnyAsync())
            {
                var movies = new List<Movie>
                {
                    new Movie
                    {
                        Movie_Name = "Avengers: Doomsday",
                        Release_Date = ToUtc(new DateTime(2026, 5, 1)),
                        End_Date = ToUtc(new DateTime(2026, 10, 31)),
                        Production_Company = "Marvel Studios",
                        Director = "Anthony Russo, Joe Russo",
                        Cast = "Robert Downey Jr., Chris Evans, Scarlett Johansson, Benedict Cumberbatch",
                        Duration = 149,
                        Genre = "Action, Sci-Fi",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Doctor Doom threatens to collapse all of reality. The Avengers must assemble one final time to stop him.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/j6BLmRMkfU2bEGqn6DVBxD2sLFM.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=C-3F1IGTX1E",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Mission: Impossible – The Final Reckoning",
                        Release_Date = ToUtc(new DateTime(2025, 5, 22)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Paramount Pictures",
                        Director = "Christopher McQuarrie",
                        Cast = "Tom Cruise, Hayley Atwell, Ving Rhames, Angela Bassett, Henry Czerny",
                        Duration = 169,
                        Genre = "Action, Thriller",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Ethan Hunt and the IMF face their deadliest mission yet against a rogue AI that controls the world's nuclear arsenals.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcvaI3jWMnMkOp4I.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=avz06PDqDbM",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Superman",
                        Release_Date = ToUtc(new DateTime(2025, 7, 11)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "DC Studios / Warner Bros.",
                        Director = "James Gunn",
                        Cast = "David Corenswet, Rachel Brosnahan, Nicholas Hoult, Edi Gathegi",
                        Duration = 129,
                        Genre = "Action, Sci-Fi, Adventure",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Clark Kent balances his life as a reporter and as Superman, Earth's greatest hero, facing an alien threat.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=2vjCDx5oqgA",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "The Fantastic Four: First Steps",
                        Release_Date = ToUtc(new DateTime(2025, 7, 25)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Marvel Studios",
                        Director = "Matt Shakman",
                        Cast = "Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach, Julia Garner",
                        Duration = 125,
                        Genre = "Action, Sci-Fi, Adventure",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Marvel's First Family is thrust into a perilous adventure in a retro-futuristic 1960s universe.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/9n2tJBplPbgR2ca05hS5CKXwP2c.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=v36qxfLNrPg",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Jurassic World Rebirth",
                        Release_Date = ToUtc(new DateTime(2025, 7, 2)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Universal Pictures",
                        Director = "Gareth Edwards",
                        Cast = "Scarlett Johansson, Jonathan Bailey, Mahershala Ali, Manuel Garcia-Rulfo",
                        Duration = 119,
                        Genre = "Action, Adventure, Sci-Fi",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "A team ventures to a remote island to obtain dinosaur DNA with the power to save human lives.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/vIeu8WysZrTSFb2uhPViKjX0Wjl.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=wBqJdFGLEsk",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "F1",
                        Release_Date = ToUtc(new DateTime(2025, 6, 25)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Apple Original Films / Warner Bros.",
                        Director = "Joseph Kosinski",
                        Cast = "Brad Pitt, Damson Idris, Kerry Condon, Javier Bardem",
                        Duration = 144,
                        Genre = "Action, Drama, Sport",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "A retired Formula 1 driver comes back to the track to mentor a talented young rookie.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=yqAX7l3OAag",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "How to Train Your Dragon",
                        Release_Date = ToUtc(new DateTime(2025, 6, 13)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Universal Pictures / DreamWorks",
                        Director = "Dean DeBlois",
                        Cast = "Mason Thames, Nico Parker, Gerard Butler, Cate Blanchett",
                        Duration = 124,
                        Genre = "Adventure, Fantasy, Family",
                        Rating = "PG",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "A young Viking befriends a dragon and must fight to protect him from his own tribe.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/q2AY61gMgXebrNmKOhbBdCkKBVh.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=_LWW7_Cxe9E",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Lilo & Stitch",
                        Release_Date = ToUtc(new DateTime(2025, 5, 23)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Walt Disney Pictures",
                        Director = "Dean Fleischer Camp",
                        Cast = "Maia Kealoha, Sydney Agudong, Zach Galifianakis, Chris Sanders",
                        Duration = 108,
                        Genre = "Comedy, Family, Sci-Fi",
                        Rating = "PG",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "A lonely Hawaiian girl befriends an alien experiment that has escaped from space.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/dRGeQFXwKSWfANSNFDvRIKC0iNr.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=fbtObXe4kXs",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Sinners",
                        Release_Date = ToUtc(new DateTime(2025, 4, 18)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Warner Bros. Pictures",
                        Director = "Ryan Coogler",
                        Cast = "Michael B. Jordan, Hailee Steinfeld, Jack O'Connell, Wunmi Mosaku",
                        Duration = 137,
                        Genre = "Horror, Thriller, Drama",
                        Rating = "R",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Twin brothers trying to leave their troubled lives behind find a Mississippi town infested with an evil threat.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/wAOv3HWMn20HGT4xZzE1qQfCCrg.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=TaJHGYyGPsM",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Thunderbolts*",
                        Release_Date = ToUtc(new DateTime(2025, 5, 2)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Marvel Studios",
                        Director = "Jake Schreier",
                        Cast = "Florence Pugh, Sebastian Stan, David Harbour, Wyatt Russell, Julia Louis-Dreyfus",
                        Duration = 127,
                        Genre = "Action, Adventure, Superhero",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "A team of antiheroes assembled by the government must stop a threat more dangerous than any of them.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/m9EtP1Yrzv6v7dMaC9mRaGhd1um.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=UHmJFKKrXFo",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Zootopia 2",
                        Release_Date = ToUtc(new DateTime(2025, 11, 26)),
                        End_Date = ToUtc(new DateTime(2027, 2, 28)),
                        Production_Company = "Walt Disney Animation Studios",
                        Director = "Byron Howard, Rich Moore",
                        Cast = "Ginnifer Goodwin, Jason Bateman, Idris Elba, Jenny Slate",
                        Duration = 108,
                        Genre = "Animation, Comedy, Adventure",
                        Rating = "PG",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Judy Hopps and Nick Wilde return for a brand-new adventure as Zootopia faces an unexpected new crisis.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/t3j5gSbZPW2p6IwlMo1OWKb8LiP.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=example_zootopia2",
                        Status = "ComingSoon",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Avatar: Fire and Ash",
                        Release_Date = ToUtc(new DateTime(2025, 12, 19)),
                        End_Date = ToUtc(new DateTime(2027, 3, 31)),
                        Production_Company = "20th Century Studios / Lightstorm",
                        Director = "James Cameron",
                        Cast = "Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang",
                        Duration = 180,
                        Genre = "Action, Sci-Fi, Adventure",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Jake Sully and Neytiri face an even greater threat to Pandora in this breathtaking third chapter.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=example_avatar3",
                        Status = "ComingSoon",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    },
                    new Movie
                    {
                        Movie_Name = "Captain America: Brave New World",
                        Release_Date = ToUtc(new DateTime(2025, 2, 14)),
                        End_Date = ToUtc(new DateTime(2026, 9, 30)),
                        Production_Company = "Marvel Studios",
                        Director = "Julius Onah",
                        Cast = "Anthony Mackie, Harrison Ford, Danny Ramirez, Liv Tyler",
                        Duration = 118,
                        Genre = "Action, Superhero, Adventure",
                        Rating = "PG-13",
                        Language = "English",
                        Country = "USA",
                        Synopsis = "Sam Wilson takes on the mantle of Captain America and faces a global conspiracy involving the Red Hulk.",
                        Poster_URL = "https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg",
                        Trailer_Link = "https://www.youtube.com/watch?v=q27Y5Yk0ER8",
                        Status = "NowShowing",
                        Created_By = adminId,
                        Created_At = nowUtc,
                        Updated_At = nowUtc
                    }
                };

                await context.Movies.AddRangeAsync(movies);
                await context.SaveChangesAsync();
            }

            // 6. Seed Promotions
            if (!await context.Promotions.AnyAsync())
            {
                var promotions = new List<Promotion>
                {
                    new Promotion
                    {
                        Title = "Chào mừng tháng 9",
                        Promotion_Code = "THANG9",
                        Start_Date = ToUtc(new DateTime(2026, 9, 1)),
                        End_Date = ToUtc(new DateTime(2026, 10, 31)),
                        Discount_Type = "Percentage",
                        Discount_Value = 10,
                        Minimum_Purchase = 150000,
                        Maximum_Discount = 50000,
                        Applicable_For = "All",
                        Usage_Limit = 500,
                        Current_Usage = 0,
                        Status = "Active",
                        Promotion_Detail = "Giảm 10% cho tất cả đơn hàng từ 150,000đ trong tháng 9",
                        Created_By = adminId,
                        Created_At = nowUtc
                    },
                    new Promotion
                    {
                        Title = "Thứ 4 vui vẻ",
                        Promotion_Code = "WED50K",
                        Start_Date = ToUtc(new DateTime(2026, 8, 26)),
                        End_Date = ToUtc(new DateTime(2026, 12, 31)),
                        Discount_Type = "Fixed",
                        Discount_Value = 50000,
                        Minimum_Purchase = 200000,
                        Maximum_Discount = 50000,
                        Applicable_For = "All",
                        Usage_Limit = 1000,
                        Current_Usage = 0,
                        Status = "Active",
                        Promotion_Detail = "Giảm 50,000đ mỗi thứ 4 hàng tuần",
                        Created_By = adminId,
                        Created_At = nowUtc
                    },
                    new Promotion
                    {
                        Title = "VIP Member",
                        Promotion_Code = "VIP20",
                        Start_Date = ToUtc(new DateTime(2026, 8, 26)),
                        End_Date = ToUtc(new DateTime(2026, 12, 31)),
                        Discount_Type = "Percentage",
                        Discount_Value = 20,
                        Minimum_Purchase = 100000,
                        Maximum_Discount = 100000,
                        Applicable_For = "VIP",
                        Usage_Limit = 200,
                        Current_Usage = 0,
                        Status = "Active",
                        Promotion_Detail = "Ưu đãi 20% dành riêng cho thành viên VIP",
                        Created_By = adminId,
                        Created_At = nowUtc
                    }
                };

                await context.Promotions.AddRangeAsync(promotions);
                await context.SaveChangesAsync();
            }

            // 7. Seed Showtimes (35 days from today)
            if (!await context.Showtimes.AnyAsync())
            {
                var movieList = await context.Movies.OrderBy(m => m.Movie_ID).ToListAsync();
                if (movieList.Count >= 10)
                {
                    var showtimes = new List<Showtime>();
                    var todayUtc = DateTime.UtcNow.Date;

                    for (int day = 0; day < 35; day++)
                    {
                        var showDate = ToUtc(todayUtc.AddDays(day));
                        var dow = showDate.DayOfWeek;

                        // Room 1 (Standard)
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[0].Movie_ID,
                            Cinema_Room_ID = room1Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(9, 0, 0),
                            End_Time = new TimeSpan(11, 29, 0),
                            Price_Tier = "Standard",
                            Base_Price = 75000,
                            Status = "Active",
                            Capacity_Available = 120,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[4].Movie_ID,
                            Cinema_Room_ID = room1Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(13, 30, 0),
                            End_Time = new TimeSpan(15, 29, 0),
                            Price_Tier = "Standard",
                            Base_Price = 75000,
                            Status = "Active",
                            Capacity_Available = 120,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[6].Movie_ID,
                            Cinema_Room_ID = room1Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(17, 0, 0),
                            End_Time = new TimeSpan(19, 4, 0),
                            Price_Tier = "Standard",
                            Base_Price = 75000,
                            Status = "Active",
                            Capacity_Available = 120,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[7].Movie_ID,
                            Cinema_Room_ID = room1Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(21, 0, 0),
                            End_Time = new TimeSpan(22, 48, 0),
                            Price_Tier = "Standard",
                            Base_Price = 75000,
                            Status = "Active",
                            Capacity_Available = 120,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });

                        // Room 2 (VIP)
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[1].Movie_ID,
                            Cinema_Room_ID = room2Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(10, 0, 0),
                            End_Time = new TimeSpan(12, 49, 0),
                            Price_Tier = "VIP",
                            Base_Price = 120000,
                            Status = "Active",
                            Capacity_Available = 80,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[5].Movie_ID,
                            Cinema_Room_ID = room2Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(14, 30, 0),
                            End_Time = new TimeSpan(16, 54, 0),
                            Price_Tier = "VIP",
                            Base_Price = 120000,
                            Status = "Active",
                            Capacity_Available = 80,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[9].Movie_ID,
                            Cinema_Room_ID = room2Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(19, 0, 0),
                            End_Time = new TimeSpan(21, 7, 0),
                            Price_Tier = "VIP",
                            Base_Price = 120000,
                            Status = "Active",
                            Capacity_Available = 80,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });

                        // Room 3 (IMAX)
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[2].Movie_ID,
                            Cinema_Room_ID = room3Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(10, 30, 0),
                            End_Time = new TimeSpan(12, 39, 0),
                            Price_Tier = "IMAX",
                            Base_Price = 130000,
                            Status = "Active",
                            Capacity_Available = 150,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[3].Movie_ID,
                            Cinema_Room_ID = room3Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(15, 0, 0),
                            End_Time = new TimeSpan(17, 5, 0),
                            Price_Tier = "IMAX",
                            Base_Price = 130000,
                            Status = "Active",
                            Capacity_Available = 150,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });
                        showtimes.Add(new Showtime
                        {
                            Movie_ID = movieList[0].Movie_ID,
                            Cinema_Room_ID = room3Id,
                            Show_Date = showDate,
                            Start_Time = new TimeSpan(19, 30, 0),
                            End_Time = new TimeSpan(21, 59, 0),
                            Price_Tier = "IMAX",
                            Base_Price = 130000,
                            Status = "Active",
                            Capacity_Available = 150,
                            Created_By = adminId,
                            Created_At = nowUtc,
                            Updated_At = nowUtc
                        });

                        // Weekend extras (Friday, Saturday, Sunday)
                        if (dow == DayOfWeek.Friday || dow == DayOfWeek.Saturday || dow == DayOfWeek.Sunday)
                        {
                            if (movieList.Count > 8)
                            {
                                showtimes.Add(new Showtime
                                {
                                    Movie_ID = movieList[8].Movie_ID,
                                    Cinema_Room_ID = room1Id,
                                    Show_Date = showDate,
                                    Start_Time = new TimeSpan(11, 30, 0),
                                    End_Time = new TimeSpan(13, 47, 0),
                                    Price_Tier = "Standard",
                                    Base_Price = 75000,
                                    Status = "Active",
                                    Capacity_Available = 120,
                                    Created_By = adminId,
                                    Created_At = nowUtc,
                                    Updated_At = nowUtc
                                });
                            }
                            if (movieList.Count > 12)
                            {
                                showtimes.Add(new Showtime
                                {
                                    Movie_ID = movieList[12].Movie_ID,
                                    Cinema_Room_ID = room2Id,
                                    Show_Date = showDate,
                                    Start_Time = new TimeSpan(11, 0, 0),
                                    End_Time = new TimeSpan(12, 58, 0),
                                    Price_Tier = "VIP",
                                    Base_Price = 120000,
                                    Status = "Active",
                                    Capacity_Available = 80,
                                    Created_By = adminId,
                                    Created_At = nowUtc,
                                    Updated_At = nowUtc
                                });
                            }
                            if (movieList.Count > 1)
                            {
                                showtimes.Add(new Showtime
                                {
                                    Movie_ID = movieList[1].Movie_ID,
                                    Cinema_Room_ID = room3Id,
                                    Show_Date = showDate,
                                    Start_Time = new TimeSpan(13, 0, 0),
                                    End_Time = new TimeSpan(15, 49, 0),
                                    Price_Tier = "IMAX",
                                    Base_Price = 130000,
                                    Status = "Active",
                                    Capacity_Available = 150,
                                    Created_By = adminId,
                                    Created_At = nowUtc,
                                    Updated_At = nowUtc
                                });
                            }
                        }
                    }

                    await context.Showtimes.AddRangeAsync(showtimes);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
