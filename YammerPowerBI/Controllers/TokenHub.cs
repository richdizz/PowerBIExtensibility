using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace YammerPowerBI.Controllers
{
    public class TokenHub : Hub
    {
        public void Initialize()
        {

        }
        public void SendToken(string clientID, string token)
        {
            Clients.Client(clientID).sendToken(token);
        }
    }
}