using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OsseousAsh.Server
{
    public class PerformanceOptimizer
    {
        // Simple in-memory cache implementation
        private readonly Dictionary<string, CacheItem> _cache = new();
        private readonly object _cacheLock = new();

        public class CacheItem
        {
            public object Data { get; set; }
            public DateTime Expiry { get; set; }
        }

        public bool TryGetFromCache<T>(string key, out T value)
        {
            value = default;

            lock (_cacheLock)
            {
                if (_cache.TryGetValue(key, out var item) && DateTime.UtcNow < item.Expiry)
                {
                    value = (T)item.Data;
                    return true;
                }

                if (item != null) // Remove expired item
                    _cache.Remove(key);
            }

            return false;
        }

        public void SetCache<T>(string key, T value, TimeSpan expiry)
        {
            lock (_cacheLock)
            {
                _cache[key] = new CacheItem
                {
                    Data = value,
                    Expiry = DateTime.UtcNow.Add(expiry)
                };
            }
        }
    }
}
