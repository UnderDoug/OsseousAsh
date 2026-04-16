using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server.Middleware
{
    public class RateLimitingMiddleware : IMiddleware
    {
        private readonly Dictionary<string, Queue<DateTime>> _requestHistory = new Dictionary<string, Queue<DateTime>>();
        private readonly int _maxRequests;
        private readonly TimeSpan _timeWindow;
        private readonly object _lock = new object();

        public RateLimitingMiddleware(int maxRequests = 100, TimeSpan timeWindow = default)
        {
            _maxRequests = maxRequests;
            _timeWindow = timeWindow == default
                ? TimeSpan.FromMinutes(1)
                : timeWindow
                ;
        }

        public async Task<ApiResponse> InvokeAsync(ApiRequest request, Func<ApiRequest, Task<ApiResponse>> next)
        {
            var clientId = GetClientIdentifier(request);

            lock (_lock)
            {
                if (!_requestHistory.ContainsKey(clientId))
                    _requestHistory[clientId] = new Queue<DateTime>();

                var clientRequests = _requestHistory[clientId];
                var cutoffTime = DateTime.UtcNow - _timeWindow;

                // Remove old requests
                while (clientRequests.Count > 0
                    && clientRequests.Peek() < cutoffTime)
                    clientRequests.Dequeue();

                if (clientRequests.Count >= _maxRequests)
                {
                    return new ApiResponse
                    {
                        StatusCode = 429,
                        Body = JsonHelper.Serialize(new { error = "Rate limit exceeded", retryAfter = _timeWindow.TotalSeconds })
                    };
                }

                clientRequests.Enqueue(DateTime.UtcNow);
            }

            return await next(request);
        }

        // In a real application, you might use IP address, API key, or user ID
        private string GetClientIdentifier(ApiRequest request)
            => request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor)
            ? forwardedFor
            : "unknown"
            ;
    }
}
