using Microsoft.AspNetCore.SignalR;

namespace STP.APIService.Hubs
{
    public class SeatHub : Hub
    {
        public async Task UpdateSeatStatus(string seatId, string status)
        {
            await Clients.All.SendAsync("ReceiveSeatUpdate", seatId, status);
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("Connected", Context.ConnectionId);
            await base.OnConnectedAsync();
        }
    }
}
