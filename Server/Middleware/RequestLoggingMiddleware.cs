using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server.Middleware
{
    public class RequestLoggingMiddleware : IMiddleware
    {
        public async Task<ApiResponse> InvokeAsync(ApiRequest request, Func<ApiRequest, Task<ApiResponse>> next)
        {
            var stopwatch = Stopwatch.StartNew();
            Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] {request.Method} {request.Url.PathAndQuery} - Started");

            var response = await next(request);

            stopwatch.Stop();
            Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] {request.Method} {request.Url.PathAndQuery} - Completed in {stopwatch.ElapsedMilliseconds}ms (Status: {response.StatusCode})");

            return response;
        }
    }
}
