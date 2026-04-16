using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OsseousAsh.Server.API
{
    public class ApiRequest
    {
        public string Method { get; set; }
        public Uri Url { get; set; }
        public Dictionary<string, string> Headers { get; set; }
        public Dictionary<string, string> RouteParameters { get; set; }
        public string Body { get; set; }
    }
    public class CreateUserRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public class UpdateUserRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
    }
}
