using System;
using System.Net;
using System.Threading.Tasks;
using System.Text;
using System.Text.Json;
using OsseousAsh.Server.API;
using OsseousAsh.Server.Middleware;
using OsseousAsh.Server.Users;

namespace OsseousAsh.Server
{
    public class HttpAPIServer
    {
        private HttpListener _listener;
        private readonly string _baseUrl = "http://localhost:8080/";
        private readonly ApiRouter _router;
        private readonly MiddlewarePipeline _pipeline;

        public HttpAPIServer()
        {
            _router = new ApiRouter();
            _pipeline = new MiddlewarePipeline();
            ConfigureRoutes();
            ConfigureMiddleware();
        }

        private async Task ListenForRequestsAsync()
        {
            while (_listener.IsListening)
            {
                var context = await _listener.GetContextAsync();
                _ = ProcessRequestAsync(context); // Fire and forget
            }
        }

        private void ConfigureRoutes()
        {
            _router.AddRoute("GET", "/api/users", UserController.GetAllUsers);
            _router.AddRoute("GET", "/api/users/{id}", UserController.GetUserById);
            _router.AddRoute("POST", "/api/users", UserController.CreateUser);
            _router.AddRoute("PUT", "/api/users/{id}", UserController.UpdateUser);
            _router.AddRoute("DELETE", "/api/users/{id}", UserController.DeleteUser);
        }

        private void ConfigureMiddleware()
        {
            _pipeline.Use(new RequestLoggingMiddleware());
            _pipeline.Use(new RateLimitingMiddleware(maxRequests: 100, TimeSpan.FromMinutes(1)));
            _pipeline.Use(new CompressionMiddleware());
        }

        public async Task StartAsync()
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add(_baseUrl);
            _listener.Start();

            Console.WriteLine($"RESTful API Server started at {_baseUrl}");
            Console.WriteLine("Available endpoints:");
            Console.WriteLine("  GET    /api/users     - Get all users");
            Console.WriteLine("  GET    /api/users/{id} - Get user by ID");
            Console.WriteLine("  POST   /api/users     - Create new user");
            Console.WriteLine("  PUT    /api/users/{id} - Update user");
            Console.WriteLine("  DELETE /api/users/{id} - Delete user");
            Console.WriteLine("\n Press Ctrl+C to stop the server...");

            await ListenForRequestsAsync();
        }

        private async Task SendResponseAsync(HttpListenerResponse response, ApiResponse apiResponse)
        {
            response.StatusCode = apiResponse.StatusCode;
            response.ContentType = apiResponse.ContentType;

            // Add custom headers
            foreach (var header in apiResponse.Headers)
            {
                response.Headers.Add(header.Key, header.Value);
            }

            if (!string.IsNullOrEmpty(apiResponse.Body))
            {
                var buffer = Encoding.UTF8.GetBytes(apiResponse.Body);
                response.ContentLength64 = buffer.Length;
                await response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
            }

            response.Close();
        }

        // Update ProcessRequestAsync method to use global error handler
        private async Task ProcessRequestAsync(HttpListenerContext context)
        {
            ApiRequest apiRequest = null;
            try
            {
                apiRequest = await RequestParser.ParseAsync(context.Request);
                var apiResponse = await _router.RouteAsync(apiRequest);
                await SendResponseAsync(context.Response, apiResponse);
            }
            catch (Exception ex)
            {
                var errorResponse = await GlobalErrorHandler.HandleAsync(ex, apiRequest);
                await SendResponseAsync(context.Response, errorResponse);
            }
        }

        private async Task HandleErrorAsync(HttpListenerResponse Response, Exception Ex)
        {
            Response.StatusCode = 500;
            Response.ContentType = "application/json";

            var buffer = Encoding.UTF8.GetBytes(
                s: JsonSerializer.Serialize(
                    value: new
                    {
                        error = "Internal Server Error",
                        message = Ex.Message
                    })
                );

            await Response.OutputStream.WriteAsync(buffer);
            Response.Close();
        }
    }
}
