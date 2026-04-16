using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server.Middleware
{
    public class MiddlewarePipeline
    {
        private readonly List<IMiddleware> _middlewares = new List<IMiddleware>();

        public void Use(IMiddleware middleware)
        {
            _middlewares.Add(middleware);
        }

        public async Task<ApiResponse> ExecuteAsync(ApiRequest request, Func<ApiRequest, Task<ApiResponse>> finalHandler)
        {
            Func<ApiRequest, Task<ApiResponse>> pipeline = finalHandler;

            // Build pipeline in reverse order
            for (int i = _middlewares.Count - 1; i >= 0; i--)
            {
                var currentMiddleware = _middlewares[i];
                var nextHandler = pipeline;
                pipeline = (req) => currentMiddleware.InvokeAsync(req, nextHandler);
            }

            return await pipeline(request);
        }
    }
}
