using sa25.Repository.Data;
using STP.Repository.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class MovieService
    {
        //private readonly UnitOfWork _unitOfWork;
        private readonly CinemaDbContext _context;

        public MovieService(CinemaDbContext context)
        {
            _context = context;
        }


    }
}
