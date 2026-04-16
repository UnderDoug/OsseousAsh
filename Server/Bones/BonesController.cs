using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace OsseousAsh.Server.Bones
{
    public class BonesController
    {
        /*
        private static readonly Dictionary<string, SaveBonesJSON> _BonesCache;

        public static string BonesPath => "../Bones";

        public static async IEnumerable<SaveBonesJSON> GetSaveBonesAsync()
        {
            if (!Directory.Exists(BonesPath))
            {
                try
                {
                    Directory.CreateDirectory(BonesPath);
                }
                catch (Exception x)
                {
                    Console.WriteLine($"Failed to create directory \"{BonesPath}\": {x}");
                }
            }
        }

        // GET /api/users
        public static async Task<ApiResponse> GetAllUsers(ApiRequest request)
        {
            var response = new ApiResponse
            {
                StatusCode = 200,
                ContentType = "application/json",
                Body = JsonSerializer.Serialize(Bones, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
            };

            return await Task.FromResult(response);
        }

        // GET /api/users/{id}
        public static async Task<ApiResponse> GetUserById(ApiRequest request)
        {
            if (!int.TryParse(request.RouteParameters["id"], out int userId))
            {
                return new ApiResponse { StatusCode = 400, Body = JsonSerializer.Serialize(new { error = "Invalid user ID" }) };
            }

            var user = Bones.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return new ApiResponse { StatusCode = 404, Body = JsonSerializer.Serialize(new { error = "User not found" }) };
            }

            return new ApiResponse
            {
                StatusCode = 200,
                ContentType = "application/json",
                Body = JsonSerializer.Serialize(user, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
            };
        }

        // POST /api/users
        public static async Task<ApiResponse> CreateBones(ApiRequest request)
        {
            try
            {
                var createUserRequest = JsonSerializer.Deserialize<CreateUserRequest>(request.Body,
                    new JsonSerializerOptions 
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    });

                if (string.IsNullOrEmpty(createUserRequest.Name)
                    || string.IsNullOrEmpty(createUserRequest.Email))
                    return new ApiResponse 
                    {
                        StatusCode = 400,
                        Body = JsonSerializer.Serialize(new { error = "Name and Email are required" }),
                    };

                var newUser = new User
                {
                    Id = _nextId++,
                    Name = createUserRequest.Name,
                    Email = createUserRequest.Email
                };

                Bones.Add(newUser);

                return new ApiResponse
                {
                    StatusCode = 201,
                    ContentType = "application/json",
                    Body = JsonSerializer.Serialize(newUser, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
                };
            }
            catch (JsonException)
            {
                return new ApiResponse { StatusCode = 400, Body = JsonSerializer.Serialize(new { error = "Invalid JSON format" }) };
            }
        }

        // PUT /api/users/{id}
        public static async Task<ApiResponse> UpdateUser(ApiRequest request)
        {
            if (!int.TryParse(request.RouteParameters["id"], out int userId))
            {
                return new ApiResponse { StatusCode = 400, Body = JsonSerializer.Serialize(new { error = "Invalid user ID" }) };
            }

            var user = Bones.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return new ApiResponse { StatusCode = 404, Body = JsonSerializer.Serialize(new { error = "User not found" }) };
            }

            try
            {
                var updateRequest = JsonSerializer.Deserialize<UpdateUserRequest>(request.Body,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

                if (!string.IsNullOrEmpty(updateRequest.Name))
                    user.Name = updateRequest.Name;
                if (!string.IsNullOrEmpty(updateRequest.Email))
                    user.Email = updateRequest.Email;

                return new ApiResponse
                {
                    StatusCode = 200,
                    ContentType = "application/json",
                    Body = JsonSerializer.Serialize(user, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase })
                };
            }
            catch (JsonException)
            {
                return new ApiResponse { StatusCode = 400, Body = JsonSerializer.Serialize(new { error = "Invalid JSON format" }) };
            }
        }

        // DELETE /api/users/{id}
        public static async Task<ApiResponse> DeleteUser(ApiRequest request)
        {
            if (!int.TryParse(request.RouteParameters["id"], out int userId))
            {
                return new ApiResponse { StatusCode = 400, Body = JsonSerializer.Serialize(new { error = "Invalid user ID" }) };
            }

            var user = Bones.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return new ApiResponse { StatusCode = 404, Body = JsonSerializer.Serialize(new { error = "User not found" }) };
            }

            Bones.Remove(user);

            return new ApiResponse { StatusCode = 204 }; // No Content
        }
        */
    }
}
