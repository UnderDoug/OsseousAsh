using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server.Middleware
{
    public interface IMiddleware
    {
        Task<ApiResponse> InvokeAsync(ApiRequest request, Func<ApiRequest, Task<ApiResponse>> next);
    }
}
