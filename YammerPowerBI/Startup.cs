using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(YammerPowerBI.Startup))]
namespace YammerPowerBI
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
            app.MapSignalR();
        }
    }
}
