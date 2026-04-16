using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OsseousAsh.Server
{
    // Connection pooling for database operations
    public class ConnectionPool
    {
        private readonly Queue<IDbConnection> _pool = new Queue<IDbConnection>();
        private readonly int _maxSize;
        private readonly string _connectionString;
        private readonly object _lock = new object();

        public ConnectionPool(string connectionString, int maxSize = 10)
        {
            _connectionString = connectionString;
            _maxSize = maxSize;
        }

        public IDbConnection GetConnection()
        {
            lock (_lock)
            {
                if (_pool.Count > 0)
                    return _pool.Dequeue();
            }

            // Create new connection if pool is empty
            return CreateConnection();
        }

        public void ReturnConnection(IDbConnection connection)
        {
            lock (_lock)
            {
                if (_pool.Count < _maxSize && connection.State == ConnectionState.Open)
                    _pool.Enqueue(connection);
                else
                    connection.Dispose();
            }
        }

        private IDbConnection CreateConnection()
        {
            // Implementation depends on your database provider
            // Example: return new SqlConnection(_connectionString);
            throw new NotImplementedException("Implement based on your database provider");
        }
    }
}
