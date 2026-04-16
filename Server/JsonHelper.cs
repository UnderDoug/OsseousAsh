using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace OsseousAsh.Server
{
    public static class JsonHelper
    {
        private static readonly JsonSerializerOptions _serializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            PropertyNameCaseInsensitive = true
        };

        public static string Serialize<T>(T Value)
            => JsonSerializer.Serialize(Value, _serializerOptions)
            ;

        public static T Deserialize<T>(string JSON)
            => !string.IsNullOrWhiteSpace(JSON)
            ? JsonSerializer.Deserialize<T>(JSON, _serializerOptions)
            : throw new ArgumentException("JSON string cannot be null or empty")
            ;

        public static bool TryDeserialize<T>(string JSON, out T Result)
        {
            Result = default;
            try
            {
                Result = Deserialize<T>(JSON);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
