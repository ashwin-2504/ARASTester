using Aras.IOM;
using ArasBackend.Models;

namespace ArasBackend.Services;

/// <summary>
/// Service for managing ARAS Innovator connections using Aras.IOM
/// </summary>
public class ArasConnectionService
{
    private HttpServerConnection? _connection;
    private Innovator? _innovator;
    private readonly object _lock = new();
    
    /// <summary>
    /// Gets whether the service is currently connected to ARAS
    /// </summary>
    public bool IsConnected => _innovator != null && _connection != null;
    
    /// <summary>
    /// Gets the current server info if connected
    /// </summary>
    public ServerInfo? CurrentServerInfo { get; private set; }

    /// <summary>
    /// Connect to ARAS Innovator server
    /// </summary>
    public ConnectionResponse Connect(ConnectionRequest request)
    {
        lock (_lock)
        {
            try
            {
                // Disconnect any existing connection first
                if (IsConnected)
                {
                    Disconnect();
                }

                // Create the server connection
                _connection = IomFactory.CreateHttpServerConnection(
                    request.Url,
                    request.Database,
                    request.Username,
                    request.Password
                );

                // Attempt to login
                var loginResult = _connection.Login();
                
                if (loginResult.isError())
                {
                    var errorMessage = loginResult.getErrorString();
                    _connection = null;
                    return new ConnectionResponse
                    {
                        Success = false,
                        Message = $"Login failed: {errorMessage}"
                    };
                }

                // Create the Innovator instance
                _innovator = loginResult.getInnovator();
                
                // Store server info
                CurrentServerInfo = new ServerInfo
                {
                    Database = request.Database,
                    UserId = _innovator.getUserID(),
                    UserName = request.Username
                };

                return new ConnectionResponse
                {
                    Success = true,
                    Message = "Successfully connected to ARAS Innovator",
                    ServerInfo = CurrentServerInfo
                };
            }
            catch (Exception ex)
            {
                _connection = null;
                _innovator = null;
                CurrentServerInfo = null;
                
                return new ConnectionResponse
                {
                    Success = false,
                    Message = $"Connection error: {ex.Message}"
                };
            }
        }
    }

    /// <summary>
    /// Disconnect from ARAS Innovator server
    /// </summary>
    public ConnectionResponse Disconnect()
    {
        lock (_lock)
        {
            try
            {
                if (_connection != null)
                {
                    _connection.Logout();
                    _connection = null;
                }
                
                _innovator = null;
                CurrentServerInfo = null;

                return new ConnectionResponse
                {
                    Success = true,
                    Message = "Disconnected from ARAS Innovator"
                };
            }
            catch (Exception ex)
            {
                _connection = null;
                _innovator = null;
                CurrentServerInfo = null;
                
                return new ConnectionResponse
                {
                    Success = false,
                    Message = $"Disconnect error: {ex.Message}"
                };
            }
        }
    }

    /// <summary>
    /// Get current connection status
    /// </summary>
    public ConnectionStatusResponse GetStatus()
    {
        lock (_lock)
        {
            return new ConnectionStatusResponse
            {
                IsConnected = IsConnected,
                Status = IsConnected ? "Connected" : "Disconnected",
                ServerInfo = CurrentServerInfo
            };
        }
    }

    /// <summary>
    /// Gets the Innovator instance for making API calls (returns null if not connected)
    /// </summary>
    public Innovator? GetInnovator()
    {
        lock (_lock)
        {
            return _innovator;
        }
    }
}
