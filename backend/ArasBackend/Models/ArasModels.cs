using System.Collections.Generic;

namespace ArasBackend.Models
{
    public class ServerInfo
    {
        public string Database { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string Url { get; set; } // Often useful to have URL even if not strictly used in loop
    }

    public class ConnectionRequest
    {
        public string Url { get; set; }
        public string Database { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class ConnectionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public ServerInfo ServerInfo { get; set; }
    }

    public class ConnectionStatusResponse
    {
         public bool IsConnected { get; set; }
         public string Status { get; set; }
         public ServerInfo ServerInfo { get; set; }
    }

    public class QueryRequest
    {
        public string ItemType { get; set; }
        public string Select { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 100;
        public Dictionary<string, string> Criteria { get; set; }
    }

    public class GetByIdRequest
    {
        public string ItemType { get; set; }
        public string Id { get; set; }
    }

    public class GetByKeyedNameRequest
    {
        public string ItemType { get; set; }
        public string KeyedName { get; set; }
    }

    public class CreateItemRequest
    {
        public string ItemType { get; set; }
        public Dictionary<string, string> Properties { get; set; }
    }

    public class UpdateItemRequest
    {
        public string ItemType { get; set; }
        public string Id { get; set; }
        public Dictionary<string, string> Properties { get; set; }
    }

    public class DeleteItemRequest
    {
        public string ItemType { get; set; }
        public string Id { get; set; }
    }

    public class LockRequest
    {
        public string ItemType { get; set; }
        public string Id { get; set; }
    }

    public class PromoteRequest
    {
        public string ItemType { get; set; }
        public string Id { get; set; }
        public string TargetState { get; set; }
        public string Comments { get; set; }
    }

    public class ApplyAmlRequest
    {
        public string Aml { get; set; }
    }

    public class ApplySqlRequest
    {
        public string Sql { get; set; }
    }

    public class AssertExistsRequest
    {
        public string ItemType { get; set; }
        public Dictionary<string, string> Criteria { get; set; }
    }

    public class AssertPropertyRequest
    {
        public string ItemType { get; set; }
        public string Id { get; set; }
        public string Property { get; set; }
        public string Expected { get; set; }
    }

    public class AssertStateRequest
    {
        public string ItemType { get; set; }
        public string Id { get; set; }
        public string ExpectedState { get; set; }
    }

    public class ItemResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }
        public int ItemCount { get; set; }
    }

    public class AssertionResponse
    {
        public bool Success { get; set; }
        public bool Passed { get; set; }
        public string Message { get; set; }
        public string ActualValue { get; set; }
        public string ExpectedValue { get; set; }
    }
}
