namespace ArasBackend.Models;

/// <summary>
/// Request model for connecting to ARAS Innovator
/// </summary>
public class ConnectionRequest
{
    /// <summary>ARAS Innovator Server URL (e.g., http://server/InnovatorServer)</summary>
    public required string Url { get; set; }
    
    /// <summary>Database name to connect to</summary>
    public required string Database { get; set; }
    
    /// <summary>Username for authentication</summary>
    public required string Username { get; set; }
    
    /// <summary>Password for authentication</summary>
    public required string Password { get; set; }
}

/// <summary>
/// Response model for connection operations
/// </summary>
public class ConnectionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public ServerInfo? ServerInfo { get; set; }
}

/// <summary>
/// Information about the connected ARAS server
/// </summary>
public class ServerInfo
{
    public string? Database { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
}

/// <summary>
/// Response model for connection status
/// </summary>
public class ConnectionStatusResponse
{
    public bool IsConnected { get; set; }
    public string Status { get; set; } = "Disconnected";
    public ServerInfo? ServerInfo { get; set; }
}
