using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace STP.Repository.Dtos
{
    public class NotificationDto
    {
        public int Notification_ID { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime Creation_Date { get; set; }
        public bool Is_Read { get; set; } = false; // Giả lập, luôn là false
        public DateTime? Read_Date { get; set; } = null;
        public string Type { get; set; }
        public int? Related_ID { get; set; }
    }

    public class NotificationListResponseDto
    {
        public bool Success { get; set; }
        public int TotalCount { get; set; }
        public int UnreadCount { get; set; }
        public List<NotificationDto> Notifications { get; set; }
    }
}
