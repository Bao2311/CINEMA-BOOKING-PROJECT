using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STP.Repository.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cinema_Rooms",
                columns: table => new
                {
                    Cinema_Room_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Room_Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Seat_Quantity = table.Column<int>(type: "int", nullable: false),
                    Room_Type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cinema_Rooms", x => x.Cinema_Room_ID);
                });

            migrationBuilder.CreateTable(
                name: "FailedLogins",
                columns: table => new
                {
                    FailedLogin_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_ID = table.Column<int>(type: "int", nullable: false),
                    IP_Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AttemptTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FailedLogins", x => x.FailedLogin_ID);
                });

            migrationBuilder.CreateTable(
                name: "Ticket_Pricing",
                columns: table => new
                {
                    Price_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Room_Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Seat_Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Base_Price = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Created_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Updated = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ticket_Pricing", x => x.Price_ID);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    User_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Full_Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Hire_Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Date_Of_Birth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Sex = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone_Number = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Account_Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Login = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.User_ID);
                });

            migrationBuilder.CreateTable(
                name: "Seat_Layout",
                columns: table => new
                {
                    Layout_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Cinema_Room_ID = table.Column<int>(type: "int", nullable: false),
                    Row_Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Column_Number = table.Column<int>(type: "int", nullable: false),
                    Seat_Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seat_Layout", x => x.Layout_ID);
                    table.ForeignKey(
                        name: "FK_Seat_Layout_Cinema_Rooms_Cinema_Room_ID",
                        column: x => x.Cinema_Room_ID,
                        principalTable: "Cinema_Rooms",
                        principalColumn: "Cinema_Room_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Movies",
                columns: table => new
                {
                    Movie_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Movie_Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Release_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    End_Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Production_Company = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Director = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cast = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Duration = table.Column<int>(type: "int", nullable: false),
                    Genre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rating = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Language = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Country = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Synopsis = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Poster_URL = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Trailer_Link = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Created_By = table.Column<int>(type: "int", nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Updated_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Movies", x => x.Movie_ID);
                    table.ForeignKey(
                        name: "FK_Movies_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Points_Redemption",
                columns: table => new
                {
                    Redemption_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_ID = table.Column<int>(type: "int", nullable: false),
                    Points_Redeemed = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Points_Redemption", x => x.Redemption_ID);
                    table.ForeignKey(
                        name: "FK_Points_Redemption_Users_User_ID",
                        column: x => x.User_ID,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Promotions",
                columns: table => new
                {
                    Promotion_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Promotion_Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Start_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    End_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Discount_Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Discount_Value = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Minimum_Purchase = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Maximum_Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Applicable_For = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Usage_Limit = table.Column<int>(type: "int", nullable: true),
                    Current_Usage = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Promotion_Detail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Created_By = table.Column<int>(type: "int", nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promotions", x => x.Promotion_ID);
                    table.ForeignKey(
                        name: "FK_Promotions_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Scores",
                columns: table => new
                {
                    Score_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_ID = table.Column<int>(type: "int", nullable: false),
                    Points_Added = table.Column<int>(type: "int", nullable: false),
                    Points_Used = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scores", x => x.Score_ID);
                    table.ForeignKey(
                        name: "FK_Scores_Users_User_ID",
                        column: x => x.User_ID,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "User_Points",
                columns: table => new
                {
                    UserPoints_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_ID = table.Column<int>(type: "int", nullable: false),
                    Total_Points = table.Column<int>(type: "int", nullable: false),
                    Last_Updated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User_Points", x => x.UserPoints_ID);
                    table.ForeignKey(
                        name: "FK_User_Points_Users_User_ID",
                        column: x => x.User_ID,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Movie_Ratings",
                columns: table => new
                {
                    Rating_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Movie_ID = table.Column<int>(type: "int", nullable: false),
                    User_ID = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rating_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Verified = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Movie_Ratings", x => x.Rating_ID);
                    table.ForeignKey(
                        name: "FK_Movie_Ratings_Movies_Movie_ID",
                        column: x => x.Movie_ID,
                        principalTable: "Movies",
                        principalColumn: "Movie_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Movie_Ratings_Users_User_ID",
                        column: x => x.User_ID,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Showtimes",
                columns: table => new
                {
                    Showtime_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Movie_ID = table.Column<int>(type: "int", nullable: false),
                    Cinema_Room_ID = table.Column<int>(type: "int", nullable: false),
                    Show_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Start_Time = table.Column<TimeSpan>(type: "time", nullable: false),
                    End_Time = table.Column<TimeSpan>(type: "time", nullable: false),
                    Price_Tier = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Base_Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Capacity_Available = table.Column<int>(type: "int", nullable: false),
                    Created_By = table.Column<int>(type: "int", nullable: false),
                    Created_At = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Updated_At = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Showtimes", x => x.Showtime_ID);
                    table.ForeignKey(
                        name: "FK_Showtimes_Cinema_Rooms_Cinema_Room_ID",
                        column: x => x.Cinema_Room_ID,
                        principalTable: "Cinema_Rooms",
                        principalColumn: "Cinema_Room_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Showtimes_Movies_Movie_ID",
                        column: x => x.Movie_ID,
                        principalTable: "Movies",
                        principalColumn: "Movie_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Showtimes_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Ticket_Bookings",
                columns: table => new
                {
                    Booking_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_ID = table.Column<int>(type: "int", nullable: true),
                    Showtime_ID = table.Column<int>(type: "int", nullable: false),
                    Promotion_ID = table.Column<int>(type: "int", nullable: true),
                    Booking_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Payment_Deadline = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Total_Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Points_Earned = table.Column<int>(type: "int", nullable: false),
                    Points_Used = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Created_By = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ticket_Bookings", x => x.Booking_ID);
                    table.ForeignKey(
                        name: "FK_Ticket_Bookings_Promotions_Promotion_ID",
                        column: x => x.Promotion_ID,
                        principalTable: "Promotions",
                        principalColumn: "Promotion_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ticket_Bookings_Showtimes_Showtime_ID",
                        column: x => x.Showtime_ID,
                        principalTable: "Showtimes",
                        principalColumn: "Showtime_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ticket_Bookings_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ticket_Bookings_Users_User_ID",
                        column: x => x.User_ID,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Booking_History",
                columns: table => new
                {
                    Booking_History_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Booking_ID = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Booking_History", x => x.Booking_History_ID);
                    table.ForeignKey(
                        name: "FK_Booking_History_Ticket_Bookings_Booking_ID",
                        column: x => x.Booking_ID,
                        principalTable: "Ticket_Bookings",
                        principalColumn: "Booking_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Payment_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Booking_ID = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Payment_Method = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Payment_Reference = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Transaction_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Payment_Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Processor_Response = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Refund_Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Refund_Date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Refund_Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Processed_By = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Payment_ID);
                    table.ForeignKey(
                        name: "FK_Payments_Ticket_Bookings_Booking_ID",
                        column: x => x.Booking_ID,
                        principalTable: "Ticket_Bookings",
                        principalColumn: "Booking_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Users_Processed_By",
                        column: x => x.Processed_By,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Points_Earning",
                columns: table => new
                {
                    Earning_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    User_ID = table.Column<int>(type: "int", nullable: false),
                    Booking_ID = table.Column<int>(type: "int", nullable: false),
                    Actual_Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Points_Earned = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Points_Earning", x => x.Earning_ID);
                    table.ForeignKey(
                        name: "FK_Points_Earning_Ticket_Bookings_Booking_ID",
                        column: x => x.Booking_ID,
                        principalTable: "Ticket_Bookings",
                        principalColumn: "Booking_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Points_Earning_Users_User_ID",
                        column: x => x.User_ID,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Promotion_Usage",
                columns: table => new
                {
                    Usage_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Promotion_ID = table.Column<int>(type: "int", nullable: false),
                    Booking_ID = table.Column<int>(type: "int", nullable: false),
                    User_ID = table.Column<int>(type: "int", nullable: false),
                    Discount_Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Applied_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HasUsed = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promotion_Usage", x => x.Usage_ID);
                    table.ForeignKey(
                        name: "FK_Promotion_Usage_Promotions_Promotion_ID",
                        column: x => x.Promotion_ID,
                        principalTable: "Promotions",
                        principalColumn: "Promotion_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Promotion_Usage_Ticket_Bookings_Booking_ID",
                        column: x => x.Booking_ID,
                        principalTable: "Ticket_Bookings",
                        principalColumn: "Booking_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Promotion_Usage_Users_User_ID",
                        column: x => x.User_ID,
                        principalTable: "Users",
                        principalColumn: "User_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Seats",
                columns: table => new
                {
                    Seat_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Layout_ID = table.Column<int>(type: "int", nullable: false),
                    Booking_ID = table.Column<int>(type: "int", nullable: true),
                    Seat_Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Last_Updated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Showtime_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seats", x => x.Seat_ID);
                    table.ForeignKey(
                        name: "FK_Seats_Seat_Layout_Layout_ID",
                        column: x => x.Layout_ID,
                        principalTable: "Seat_Layout",
                        principalColumn: "Layout_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Seats_Showtimes_Showtime_ID",
                        column: x => x.Showtime_ID,
                        principalTable: "Showtimes",
                        principalColumn: "Showtime_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Seats_Ticket_Bookings_Booking_ID",
                        column: x => x.Booking_ID,
                        principalTable: "Ticket_Bookings",
                        principalColumn: "Booking_ID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Ticket_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Booking_ID = table.Column<int>(type: "int", nullable: false),
                    Seat_ID = table.Column<int>(type: "int", nullable: false),
                    Base_Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount_Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Final_Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Ticket_Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Is_Checked_In = table.Column<bool>(type: "bit", nullable: false),
                    Check_In_Time = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Ticket_ID);
                    table.ForeignKey(
                        name: "FK_Tickets_Seats_Seat_ID",
                        column: x => x.Seat_ID,
                        principalTable: "Seats",
                        principalColumn: "Seat_ID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Ticket_Bookings_Booking_ID",
                        column: x => x.Booking_ID,
                        principalTable: "Ticket_Bookings",
                        principalColumn: "Booking_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Booking_History_Booking_ID",
                table: "Booking_History",
                column: "Booking_ID");

            migrationBuilder.CreateIndex(
                name: "IX_FailedLogins_AttemptTime",
                table: "FailedLogins",
                column: "AttemptTime");

            migrationBuilder.CreateIndex(
                name: "IX_FailedLogins_User_ID",
                table: "FailedLogins",
                column: "User_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Movie_Ratings_Movie_ID",
                table: "Movie_Ratings",
                column: "Movie_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Movie_Ratings_User_ID",
                table: "Movie_Ratings",
                column: "User_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_Created_By",
                table: "Movies",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Booking_ID",
                table: "Payments",
                column: "Booking_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Processed_By",
                table: "Payments",
                column: "Processed_By");

            migrationBuilder.CreateIndex(
                name: "IX_Points_Earning_Booking_ID",
                table: "Points_Earning",
                column: "Booking_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Points_Earning_User_ID",
                table: "Points_Earning",
                column: "User_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Points_Redemption_User_ID",
                table: "Points_Redemption",
                column: "User_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Promotion_Usage_Booking_ID",
                table: "Promotion_Usage",
                column: "Booking_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Promotion_Usage_Promotion_ID",
                table: "Promotion_Usage",
                column: "Promotion_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Promotion_Usage_User_ID",
                table: "Promotion_Usage",
                column: "User_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_Created_By",
                table: "Promotions",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_Promotion_Code",
                table: "Promotions",
                column: "Promotion_Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Scores_User_ID",
                table: "Scores",
                column: "User_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Seat_Layout_Cinema_Room_ID",
                table: "Seat_Layout",
                column: "Cinema_Room_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Seats_Booking_ID",
                table: "Seats",
                column: "Booking_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Seats_Layout_ID",
                table: "Seats",
                column: "Layout_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Seats_Showtime_ID",
                table: "Seats",
                column: "Showtime_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Showtimes_Cinema_Room_ID",
                table: "Showtimes",
                column: "Cinema_Room_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Showtimes_Created_By",
                table: "Showtimes",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_Showtimes_Movie_ID",
                table: "Showtimes",
                column: "Movie_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Bookings_Created_By",
                table: "Ticket_Bookings",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Bookings_Promotion_ID",
                table: "Ticket_Bookings",
                column: "Promotion_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Bookings_Showtime_ID",
                table: "Ticket_Bookings",
                column: "Showtime_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Bookings_User_ID",
                table: "Ticket_Bookings",
                column: "User_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Pricing_Room_Type_Seat_Type",
                table: "Ticket_Pricing",
                columns: new[] { "Room_Type", "Seat_Type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Booking_ID",
                table: "Tickets",
                column: "Booking_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Seat_ID",
                table: "Tickets",
                column: "Seat_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Ticket_Code",
                table: "Tickets",
                column: "Ticket_Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_Points_User_ID",
                table: "User_Points",
                column: "User_ID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Booking_History");

            migrationBuilder.DropTable(
                name: "FailedLogins");

            migrationBuilder.DropTable(
                name: "Movie_Ratings");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Points_Earning");

            migrationBuilder.DropTable(
                name: "Points_Redemption");

            migrationBuilder.DropTable(
                name: "Promotion_Usage");

            migrationBuilder.DropTable(
                name: "Scores");

            migrationBuilder.DropTable(
                name: "Ticket_Pricing");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "User_Points");

            migrationBuilder.DropTable(
                name: "Seats");

            migrationBuilder.DropTable(
                name: "Seat_Layout");

            migrationBuilder.DropTable(
                name: "Ticket_Bookings");

            migrationBuilder.DropTable(
                name: "Promotions");

            migrationBuilder.DropTable(
                name: "Showtimes");

            migrationBuilder.DropTable(
                name: "Cinema_Rooms");

            migrationBuilder.DropTable(
                name: "Movies");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
