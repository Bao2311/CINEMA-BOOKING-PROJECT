using System;
using System.Collections.Generic;

namespace STP.Repository.Dtos
{
    public class AiChatMessageDto
    {
        public string Role { get; set; } = "user"; // "user" | "assistant"
        public string Content { get; set; } = string.Empty;
    }

    public class AiChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public List<AiChatMessageDto>? History { get; set; }
        public int? UserId { get; set; }
    }

    public class AiMovieCardDto
    {
        public int Movie_ID { get; set; }
        public string Movie_Name { get; set; } = string.Empty;
        public string? Poster_URL { get; set; }
        public int Duration { get; set; }
        public string? Rating { get; set; }
        public string? Genre { get; set; }
        public string? Status { get; set; }
        public string? Synopsis { get; set; }
    }

    public class AiShowtimeCardDto
    {
        public int Showtime_ID { get; set; }
        public int Movie_ID { get; set; }
        public string Movie_Name { get; set; } = string.Empty;
        public string? Poster_URL { get; set; }
        public string Room_Name { get; set; } = string.Empty;
        public string Room_Type { get; set; } = string.Empty;
        public string Show_Date { get; set; } = string.Empty;
        public string Start_Time { get; set; } = string.Empty;
        public string End_Time { get; set; } = string.Empty;
        public decimal Base_Price { get; set; }
        public int Capacity_Available { get; set; }
    }

    public class AiChatResponse
    {
        public string Reply { get; set; } = string.Empty;
        public List<string> SuggestedActions { get; set; } = new List<string>();
        public List<AiMovieCardDto> Movies { get; set; } = new List<AiMovieCardDto>();
        public List<AiShowtimeCardDto> Showtimes { get; set; } = new List<AiShowtimeCardDto>();
        public string? DirectBookingUrl { get; set; }
    }
}
