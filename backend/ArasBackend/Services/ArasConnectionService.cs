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

    /// <summary>
    /// Validate connection by querying current user
    /// </summary>
    public ConnectionResponse ValidateConnection()
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                {
                    return new ConnectionResponse
                    {
                        Success = false,
                        Message = "Not connected to ARAS Innovator"
                    };
                }

                // Test connection by getting current user
                var userId = _innovator.getUserID();
                var userItem = _innovator.getItemById("User", userId);
                
                if (userItem.isError())
                {
                    return new ConnectionResponse
                    {
                        Success = false,
                        Message = $"Connection validation failed: {userItem.getErrorString()}"
                    };
                }

                var userName = userItem.getProperty("keyed_name", "Unknown");
                
                return new ConnectionResponse
                {
                    Success = true,
                    Message = $"Connection valid. Logged in as: {userName}",
                    ServerInfo = CurrentServerInfo
                };
            }
            catch (Exception ex)
            {
                return new ConnectionResponse
                {
                    Success = false,
                    Message = $"Validation error: {ex.Message}"
                };
            }
        }
    }

    // ==================== CRUD Operations ====================

    public ItemResponse QueryItems(QueryRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.newItem(request.ItemType, "get");
                
                if (!string.IsNullOrEmpty(request.Select))
                    item.setAttribute("select", request.Select);
                
                item.setAttribute("page", request.Page.ToString());
                item.setAttribute("pagesize", request.PageSize.ToString());

                if (request.Criteria != null)
                {
                    foreach (var kvp in request.Criteria)
                    {
                        if (kvp.Value.Contains('%'))
                        {
                            item.setProperty(kvp.Key, kvp.Value);
                            item.setPropertyCondition(kvp.Key, "like");
                        }
                        else
                        {
                            item.setProperty(kvp.Key, kvp.Value);
                        }
                    }
                }

                var result = item.apply();
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Query successful",
                    Data = result.dom.OuterXml,
                    ItemCount = result.getItemCount()
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse GetItemById(GetByIdRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                
                if (item.isError())
                    return new ItemResponse { Success = false, Message = item.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item retrieved",
                    Data = item.dom.OuterXml,
                    ItemCount = 1
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse GetItemByKeyedName(GetByKeyedNameRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.getItemByKeyedName(request.ItemType, request.KeyedName);
                
                if (item.isError())
                    return new ItemResponse { Success = false, Message = item.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item retrieved",
                    Data = item.dom.OuterXml,
                    ItemCount = 1
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse CreateItem(CreateItemRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.newItem(request.ItemType, "add");
                
                foreach (var prop in request.Properties)
                {
                    item.setProperty(prop.Key, prop.Value);
                }

                var result = item.apply();
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item created successfully",
                    Data = new { id = result.getID(), keyed_name = result.getProperty("keyed_name", "") }
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse UpdateItem(UpdateItemRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.newItem(request.ItemType, "edit");
                item.setID(request.Id);
                
                foreach (var prop in request.Properties)
                {
                    item.setProperty(prop.Key, prop.Value);
                }

                var result = item.apply();
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item updated successfully"
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse DeleteItem(DeleteItemRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.newItem(request.ItemType, "delete");
                item.setID(request.Id);

                var result = item.apply();
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item deleted successfully"
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse PurgeItem(DeleteItemRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.newItem(request.ItemType, "purge");
                item.setID(request.Id);

                var result = item.apply();
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item purged successfully"
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    // ==================== Lock Operations ====================

    public ItemResponse LockItem(LockRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                if (item.isError())
                    return new ItemResponse { Success = false, Message = item.getErrorString() };

                var result = item.lockItem();
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item locked successfully"
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse UnlockItem(LockRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                if (item.isError())
                    return new ItemResponse { Success = false, Message = item.getErrorString() };

                var result = item.unlockItem();
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "Item unlocked successfully"
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse CheckLockStatus(LockRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                if (item.isError())
                    return new ItemResponse { Success = false, Message = item.getErrorString() };

                var lockStatus = item.fetchLockStatus();
                var lockedById = item.getProperty("locked_by_id", "");
                
                return new ItemResponse
                {
                    Success = true,
                    Message = string.IsNullOrEmpty(lockedById) ? "Item is unlocked" : "Item is locked",
                    Data = new { isLocked = !string.IsNullOrEmpty(lockedById), lockedById }
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    // ==================== Lifecycle Operations ====================

    public ItemResponse PromoteItem(PromoteRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                if (item.isError())
                    return new ItemResponse { Success = false, Message = item.getErrorString() };

                var result = item.promote(request.TargetState, request.Comments ?? "");
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = $"Item promoted to {request.TargetState}"
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse GetCurrentState(GetByIdRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                if (item.isError())
                    return new ItemResponse { Success = false, Message = item.getErrorString() };

                var state = item.getProperty("state", "Unknown");
                
                return new ItemResponse
                {
                    Success = true,
                    Message = $"Current state: {state}",
                    Data = new { state }
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    // ==================== AML & SQL ====================

    public ItemResponse ApplyAML(ApplyAmlRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var result = _innovator.applyAML(request.Aml);
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "AML executed successfully",
                    Data = result.dom.OuterXml,
                    ItemCount = result.getItemCount()
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    public ItemResponse ApplySQL(ApplySqlRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new ItemResponse { Success = false, Message = "Not connected" };

                var result = _innovator.applySQL(request.Sql);
                
                if (result.isError())
                    return new ItemResponse { Success = false, Message = result.getErrorString() };

                return new ItemResponse
                {
                    Success = true,
                    Message = "SQL executed successfully",
                    Data = result.dom.OuterXml,
                    ItemCount = result.getItemCount()
                };
            }
            catch (Exception ex)
            {
                return new ItemResponse { Success = false, Message = ex.Message };
            }
        }
    }

    // ==================== Assertions ====================

    public AssertionResponse AssertItemExists(AssertExistsRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new AssertionResponse { Success = false, Passed = false, Message = "Not connected" };

                var item = _innovator.newItem(request.ItemType, "get");
                foreach (var kvp in request.Criteria)
                {
                    item.setProperty(kvp.Key, kvp.Value);
                }

                var result = item.apply();
                var count = result.isError() ? 0 : result.getItemCount();
                var passed = count > 0;
                
                return new AssertionResponse
                {
                    Success = true,
                    Passed = passed,
                    Message = passed ? $"Found {count} matching item(s)" : "No matching items found",
                    ActualValue = count.ToString(),
                    ExpectedValue = ">0"
                };
            }
            catch (Exception ex)
            {
                return new AssertionResponse { Success = false, Passed = false, Message = ex.Message };
            }
        }
    }

    public AssertionResponse AssertItemNotExists(AssertExistsRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new AssertionResponse { Success = false, Passed = false, Message = "Not connected" };

                var item = _innovator.newItem(request.ItemType, "get");
                foreach (var kvp in request.Criteria)
                {
                    item.setProperty(kvp.Key, kvp.Value);
                }

                var result = item.apply();
                var count = result.isError() ? 0 : result.getItemCount();
                var passed = count == 0;
                
                return new AssertionResponse
                {
                    Success = true,
                    Passed = passed,
                    Message = passed ? "No matching items found (as expected)" : $"Found {count} matching item(s) - expected none",
                    ActualValue = count.ToString(),
                    ExpectedValue = "0"
                };
            }
            catch (Exception ex)
            {
                return new AssertionResponse { Success = false, Passed = false, Message = ex.Message };
            }
        }
    }

    public AssertionResponse AssertPropertyValue(AssertPropertyRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new AssertionResponse { Success = false, Passed = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                if (item.isError())
                    return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };

                var actual = item.getProperty(request.Property, "");
                var passed = actual == request.Expected;
                
                return new AssertionResponse
                {
                    Success = true,
                    Passed = passed,
                    Message = passed ? "Property value matches" : $"Expected '{request.Expected}' but got '{actual}'",
                    ActualValue = actual,
                    ExpectedValue = request.Expected
                };
            }
            catch (Exception ex)
            {
                return new AssertionResponse { Success = false, Passed = false, Message = ex.Message };
            }
        }
    }

    public AssertionResponse AssertState(AssertStateRequest request)
    {
        lock (_lock)
        {
            try
            {
                if (!IsConnected || _innovator == null)
                    return new AssertionResponse { Success = false, Passed = false, Message = "Not connected" };

                var item = _innovator.getItemById(request.ItemType, request.Id);
                if (item.isError())
                    return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };

                var actual = item.getProperty("state", "");
                var passed = actual == request.ExpectedState;
                
                return new AssertionResponse
                {
                    Success = true,
                    Passed = passed,
                    Message = passed ? "State matches" : $"Expected state '{request.ExpectedState}' but got '{actual}'",
                    ActualValue = actual,
                    ExpectedValue = request.ExpectedState
                };
            }
            catch (Exception ex)
            {
                return new AssertionResponse { Success = false, Passed = false, Message = ex.Message };
            }
        }
    }
}
