using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server
{
    public class GlobalErrorHandler
    {
        public static async Task<ApiResponse> HandleAsync(Exception Exception, ApiRequest Request = null)
        {
            // Log the exception (in real applications, use proper logging)
            Console.WriteLine($"Error: {Exception.Message}");
            Console.WriteLine($"Request: {Request.Url}");
            Console.WriteLine($"Stack Trace: {Exception.StackTrace}");

            return Exception switch
            {
                ArgumentException argEx => StatusCodes.BadRequest(argEx.Message),
                InvalidOperationException opEx => StatusCodes.BadRequest(opEx.Message),
                KeyNotFoundException => StatusCodes.NotFound(),
                JsonException => StatusCodes.BadRequest("Invalid JSON format"),
                TimeoutException => new ApiResponse
                {
                    StatusCode = 408,
                    Body = JsonHelper.Serialize(new { error = "Request timeout" })
                },
                _ => StatusCodes.InternalServerError("An unexpected error occurred"),
            };
        }
    }
}
