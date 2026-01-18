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

// ==================== CRUD Request Models ====================

public class QueryRequest
{
    public required string ItemType { get; set; }
    public string? Select { get; set; }
    public Dictionary<string, string>? Criteria { get; set; }
    public int PageSize { get; set; } = 25;
    public int Page { get; set; } = 1;
}

public class GetByIdRequest
{
    public required string ItemType { get; set; }
    public required string Id { get; set; }
    public string? Select { get; set; }
}

public class GetByKeyedNameRequest
{
    public required string ItemType { get; set; }
    public required string KeyedName { get; set; }
}

public class CreateItemRequest
{
    public required string ItemType { get; set; }
    public required Dictionary<string, string> Properties { get; set; }
}

public class UpdateItemRequest
{
    public required string ItemType { get; set; }
    public required string Id { get; set; }
    public required Dictionary<string, string> Properties { get; set; }
}

public class DeleteItemRequest
{
    public required string ItemType { get; set; }
    public required string Id { get; set; }
}

// ==================== Lock Request Models ====================

public class LockRequest
{
    public required string ItemType { get; set; }
    public required string Id { get; set; }
}

// ==================== Lifecycle Request Models ====================

public class PromoteRequest
{
    public required string ItemType { get; set; }
    public required string Id { get; set; }
    public required string TargetState { get; set; }
    public string? Comments { get; set; }
}

// ==================== AML/SQL Request Models ====================

public class ApplyAmlRequest
{
    public required string Aml { get; set; }
}

public class ApplySqlRequest
{
    public required string Sql { get; set; }
}

// ==================== Assertion Request Models ====================

public class AssertExistsRequest
{
    public required string ItemType { get; set; }
    public required Dictionary<string, string> Criteria { get; set; }
}

public class AssertPropertyRequest
{
    public required string ItemType { get; set; }
    public required string Id { get; set; }
    public required string Property { get; set; }
    public required string Expected { get; set; }
}

public class AssertStateRequest
{
    public required string ItemType { get; set; }
    public required string Id { get; set; }
    public required string ExpectedState { get; set; }
}

// ==================== Response Models ====================

public class ItemResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
    public int? ItemCount { get; set; }
}

public class AssertionResponse
{
    public bool Success { get; set; }
    public bool Passed { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ActualValue { get; set; }
    public string? ExpectedValue { get; set; }
}
