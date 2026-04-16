using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

using OsseousAsh.Server.API;

namespace OsseousAsh.Server
{
    public class RequestParser
    {
        public static async Task<ApiRequest> ParseAsync(HttpListenerRequest Request)
        {
            var apiRequest = new ApiRequest
            {
                Method = Request.HttpMethod,
                Url = Request.Url,
                Headers = new(),
                RouteParameters = ParseQueryString(Request.Url.Query),
                Body = await ReadRequestBodyAsync(Request)
            };

            // Extract headers
            foreach (string headerName in Request.Headers.AllKeys)
            {
                apiRequest.Headers[headerName] = Request.Headers[headerName];
            }

            return apiRequest;
        }

        private static Dictionary<string, string> ParseQueryString(string QueryString)
        {
            var parameters = new Dictionary<string, string>();

            if (string.IsNullOrEmpty(QueryString)) return parameters;

            QueryString = QueryString.TrimStart('?');
            var queries = QueryString.Split('&');

            foreach (var query in queries)
            {
                var parts = query.Split('=');
                if ((parts?.Length ?? 0) > 1)
                {
                    string key = Uri.UnescapeDataString(parts[0]);
                    string value = parts[1..].Aggregate("", (a, n) => a = (!string.IsNullOrEmpty(a) ? "=" : null) + n);
                    if (parts.Length == 2)
                        parameters[key] = Uri.UnescapeDataString(value);
                }
            }

            return parameters;
        }

        private static async Task<string> ReadRequestBodyAsync(HttpListenerRequest Request)
        {
            if (Request.ContentLength64 == 0) return string.Empty;

            using var reader = new StreamReader(Request.InputStream, Request.ContentEncoding);
            return await reader.ReadToEndAsync();
        }
    }
}
