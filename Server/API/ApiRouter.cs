using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace OsseousAsh.Server.API
{
    public class ApiRouter
    {
        private readonly Dictionary<string, Dictionary<string, Func<ApiRequest, Task<ApiResponse>>>> _routes;

        public ApiRouter()
        {
            _routes = new();
        }

        public void AddRoute(string method, string pattern, Func<ApiRequest, Task<ApiResponse>> handler)
        {
            if (!_routes.ContainsKey(method))
                _routes[method] = new();

            _routes[method][pattern] = handler;
        }

        public async Task<ApiResponse> RouteAsync(ApiRequest request)
        {
            if (!_routes.TryGetValue(request.Method, out var methodRoutes))
                return new ApiResponse
                {
                    StatusCode = 405,
                    Body = JsonSerializer.Serialize(
                        value: new
                        {
                            error = "Method not allowed"
                        }),
                };
            
            var path = request.Url.AbsolutePath;

            // Exact match first
            if (methodRoutes.TryGetValue(path, out var value))
                return await value(request);

            // Pattern matching for parameterized routes
            foreach (var route in methodRoutes)
            {
                if (MatchesPattern(route.Key, path, out var parameters))
                {
                    request.RouteParameters = parameters;
                    return await route.Value(request);
                }
            }

            return StatusCodes.NotFound("Route not found");
        }

        private bool MatchesPattern(string Pattern, string Path, out Dictionary<string, string> Parameters)
        {
            Parameters = new();

            var patternParts = Pattern.Split('/');
            var pathParts = Path.Split('/');

            if (patternParts.Length != pathParts.Length)
                return false;

            for (int i = 0; i < patternParts.Length; i++)
            {
                if (patternParts[i].StartsWith('{')
                    && patternParts[i].EndsWith('}'))
                {
                    var paramName = patternParts[i].Trim('{', '}');
                    Parameters[paramName] = pathParts[i];
                }
                else
                if (patternParts[i] != pathParts[i])
                    return false;
            }

            return true;
        }
    }
}
