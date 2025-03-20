using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace STP.Repository.Dtos
{
    public class RoomDTO
    {
        /// <summary>
        /// ID của phòng chiếu
        /// </summary>
        public int Cinema_Room_ID { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string Room_Name { get; set; }

        /// <summary>
        /// Loại phòng chiếu (Standard, VIP, IMAX, 4DX)
        /// </summary>
        public string Room_Type { get; set; }
    }

}
