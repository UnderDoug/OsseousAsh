using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server
{
    public static class StatusCodes
    {
        public static ApiResponse Ok(object data)
            => new ApiResponse
            {
                StatusCode = 200,
                Body = JsonHelper.Serialize(data)
            };

        public static ApiResponse Created(object data)
            => new ApiResponse
            {
                StatusCode = 201,
                Body = JsonHelper.Serialize(data)
            };

        public static ApiResponse NoContent()
            => new ApiResponse
            {
                StatusCode = 204
            };


        private static ApiResponse CreateError(int StatusCode, string ErrorMessage)
            => new ApiResponse
            {
                StatusCode = StatusCode,
                Body = JsonHelper.Serialize(
                    Value: new
                    {
                        error = ErrorMessage,
                    })
            };

        public static ApiResponse BadRequest(string Message)
            => CreateError(400, Message)
            ;

        public static ApiResponse NotFound(string Message = "Resource not found")
            => CreateError(404, Message)
            ;

        public static ApiResponse InternalServerError(string Message = "Internal server error")
            => CreateError(500, Message)
            ;
    }
}
