using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            string alternateUrl = null;
            if (args != null
                && args.Length > 0)
                alternateUrl = args[0];
            var server = new HttpAPIServer(alternateUrl);

            await server.StartAsync();
        }
    }
}
