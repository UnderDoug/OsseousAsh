using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server.Users
{
    public class UserController
    {
        private static readonly List<User> _users = new()
        {
            new User { Id = 1, Name = "John Doe", Email = "john@example.com" },
            new User { Id = 2, Name = "Jane Smith", Email = "jane@example.com" }
        };
        private static int _nextId = 3;

        // GET /api/users
        public static async Task<ApiResponse> GetAllUsers(ApiRequest Request)
        {
            var response = new ApiResponse
            {
                StatusCode = 200,
                ContentType = "application/json",
                Body = JsonHelper.Serialize(_users),
            };

            return await Task.FromResult(response);
        }

        // GET /api/users/{id}
        public static async Task<ApiResponse> GetUserById(ApiRequest Request)
        {
            if (!int.TryParse(Request.RouteParameters["id"], out int userId))
                return StatusCodes.BadRequest("Invalid user ID");

            if (_users.FirstOrDefault(u => u.Id == userId) is not User user)
                return StatusCodes.NotFound("User not found");

            return new ApiResponse
            {
                StatusCode = 200,
                ContentType = "application/json",
                Body = JsonHelper.Serialize(user),
            };
        }

        // POST /api/users
        public static async Task<ApiResponse> CreateUser(ApiRequest Request)
        {
            try
            {
                var createUserRequest = JsonHelper.Deserialize<CreateUserRequest>(Request.Body);

                if (string.IsNullOrEmpty(createUserRequest.Name)
                    || string.IsNullOrEmpty(createUserRequest.Email))
                    return StatusCodes.BadRequest("Name and Email are required");

                var newUser = new User
                {
                    Id = _nextId++,
                    Name = createUserRequest.Name,
                    Email = createUserRequest.Email
                };

                _users.Add(newUser);

                return new ApiResponse
                {
                    StatusCode = 201,
                    ContentType = "application/json",
                    Body = JsonHelper.Serialize(newUser)
                };
            }
            catch (JsonException)
            {
                return StatusCodes.BadRequest("Invalid JSON format");
            }
        }

        // PUT /api/users/{id}
        public static async Task<ApiResponse> UpdateUser(ApiRequest Request)
        {
            if (!int.TryParse(Request.RouteParameters["id"], out int userId))
                return StatusCodes.BadRequest("Invalid user ID");

            if (_users.FirstOrDefault(u => u.Id == userId) is not User user)
                return StatusCodes.NotFound("User not found");

            try
            {
                var updateRequest = JsonHelper.Deserialize<UpdateUserRequest>(Request.Body);

                if (!string.IsNullOrEmpty(updateRequest.Name))
                    user.Name = updateRequest.Name;
                if (!string.IsNullOrEmpty(updateRequest.Email))
                    user.Email = updateRequest.Email;

                return new ApiResponse
                {
                    StatusCode = 200,
                    ContentType = "application/json",
                    Body = JsonHelper.Serialize(user)
                };
            }
            catch (JsonException)
            {
                return StatusCodes.BadRequest("Invalid JSON format");
            }
        }

        // DELETE /api/users/{id}
        public static async Task<ApiResponse> DeleteUser(ApiRequest Request)
        {
            if (!int.TryParse(Request.RouteParameters["id"], out int userId))
                return StatusCodes.BadRequest("Invalid user ID");

            var user = _users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return StatusCodes.NotFound("User not found");

            _users.Remove(user);

            return new ApiResponse
            {
                StatusCode = 204 // No Content
            };
        }
    }
}
