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
            var server = new HttpAPIServer();
            await server.StartAsync();
        }
    }
}
