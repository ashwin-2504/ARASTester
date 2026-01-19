using System.Collections.Generic;

namespace ArasBackend.Core.Models
{
    public class ServerInfo
    {
        public required string Database { get; set; }
        public required string UserId { get; set; }
        public required string UserName { get; set; }
        public required string Url { get; set; }
    }

    public class ConnectionRequest
    {
        public required string Url { get; set; }
        public required string Database { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }
    }

    public class ConnectionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public ServerInfo? ServerInfo { get; set; }
    }

    public class ConnectionStatusResponse
    {
         public bool IsConnected { get; set; }
         public required string Status { get; set; }
         public ServerInfo? ServerInfo { get; set; }
    }

    public class QueryRequest
    {
        public required string ItemType { get; set; }
        public string? Select { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 100;
        public Dictionary<string, string>? Criteria { get; set; }
    }

    public class GetByIdRequest
    {
        public required string ItemType { get; set; }
        public required string Id { get; set; }
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

    public class LockRequest
    {
        public required string ItemType { get; set; }
        public required string Id { get; set; }
    }

    public class PromoteRequest
    {
        public required string ItemType { get; set; }
        public required string Id { get; set; }
        public required string TargetState { get; set; }
        public string? Comments { get; set; }
    }

    public class ApplyAmlRequest
    {
        public required string Aml { get; set; }
    }

    public class ApplySqlRequest
    {
        public required string Sql { get; set; }
    }

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
        public string? Expected { get; set; }
    }

    public class AssertStateRequest
    {
        public required string ItemType { get; set; }
        public required string Id { get; set; }
        public required string ExpectedState { get; set; }
    }

    public class ItemResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public object? Data { get; set; }
        public int ItemCount { get; set; }
    }

    public class AssertionResponse
    {
        public bool Success { get; set; }
        public bool Passed { get; set; }
        public string? Message { get; set; }
        public string? ActualValue { get; set; }
        public string? ExpectedValue { get; set; }
    }
}
