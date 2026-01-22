using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

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
        [Required, Url]
        public required string Url { get; set; }
        [Required, MinLength(1)]
        public required string Database { get; set; }
        [Required, MinLength(1)]
        public required string Username { get; set; }
        [Required]
        public required string Password { get; set; }
        public string? SessionName { get; set; }
    }

    public class ConnectionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public ServerInfo? ServerInfo { get; set; }
        public string? SessionName { get; set; }
    }

    public class ConnectionStatusResponse
    {
         public bool IsConnected { get; set; }
         public required string Status { get; set; }
         public ServerInfo? ServerInfo { get; set; }
    }

    public class QueryRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        public string? Select { get; set; }
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;

        [Range(1, 1000)]
        public int PageSize { get; set; } = 100;
        public Dictionary<string, string>? Criteria { get; set; }
    }

    public class GetByIdRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        public string? Select { get; set; }
    }

    public class GetByKeyedNameRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string KeyedName { get; set; }
        public string? Select { get; set; }
    }

    public class CreateItemRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required Dictionary<string, string> Properties { get; set; }
    }

    public class UpdateItemRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required Dictionary<string, string> Properties { get; set; }
    }

    public class DeleteItemRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
    }

    public class LockRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
    }

    public class PromoteRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string TargetState { get; set; }
        public string? Comments { get; set; }
    }

    public class ApplyAmlRequest
    {
        [Required, MinLength(1)]
        public required string Aml { get; set; }
    }

    public class ApplySqlRequest
    {
        [Required, MinLength(1)]
        public required string Sql { get; set; }
    }

    public class ApplyMethodRequest
    {
        [Required, MinLength(1)]
        public required string MethodName { get; set; }
        public string? Body { get; set; }
    }

    public class AssertExistsRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required Dictionary<string, string> Criteria { get; set; }
    }

    public class AssertPropertyRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string Property { get; set; }
        public string? Expected { get; set; }
    }

    public class AddRelationshipRequest
    {
         [Required, MinLength(1)]
         public required string ParentType { get; set; }
         [Required, MinLength(1)]
         public required string ParentId { get; set; }
         [Required, MinLength(1)]
         public required string RelationshipType { get; set; }
         [Required, MinLength(1)]
         public required string RelatedId { get; set; }
         public Dictionary<string, string>? Properties { get; set; }
    }

    public class GetRelationshipsRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string RelationshipType { get; set; }
        public string? Select { get; set; }
    }

    public class DeleteRelationshipRequest
    {
        [Required, MinLength(1)]
        public required string RelationshipType { get; set; }
        [Required, MinLength(1)]
        public required string RelationshipId { get; set; }
    }

    public class AssertStateRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string ExpectedState { get; set; }
    }

    public class StartWorkflowRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        public string? WorkflowMap { get; set; }
    }

    public class CompleteActivityRequest
    {
        [Required, MinLength(1)]
        public required string ActivityId { get; set; }
        [Required, MinLength(1)]
        public required string Path { get; set; }
        public string? Comments { get; set; }
    }

    public class AssertPropertyContainsRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string Property { get; set; }
        [Required]
        public required string Contains { get; set; }
    }

    public class AssertCountRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required]
        public required Dictionary<string, string> Criteria { get; set; }
        public int ExpectedCount { get; set; }
    }

    public class UploadFileRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string PropertyName { get; set; }
        [Required, MinLength(1)]
        public required string FilePath { get; set; }
    }

    public class DownloadFileRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string PropertyName { get; set; }
        [Required, MinLength(1)]
        public required string SavePath { get; set; }
    }

    public class VerifyFileExistsRequest
    {
        [Required, MinLength(1)]
        public required string ItemType { get; set; }
        [Required, MinLength(1)]
        public required string Id { get; set; }
        [Required, MinLength(1)]
        public required string PropertyName { get; set; }
    }

    public class GetNextSequenceRequest
    {
        [Required, MinLength(1)]
        public required string SequenceName { get; set; }
    }

    public class SetVariableRequest
    {
        [Required, MinLength(1)]
        public required string VariableName { get; set; }
        public object? Value { get; set; }
    }

    public class LogMessageRequest
    {
        [Required]
        public required string Message { get; set; }
    }

    public class WaitRequest
    {
        [Range(0, int.MaxValue)]
        public int Duration { get; set; }
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

    public class SessionInfo
    {
        public required string Name { get; set; }
        public required ServerInfo ServerInfo { get; set; }
        public bool IsCurrent { get; set; }
    }

    public class AllSessionsResponse
    {
        public List<SessionInfo> Sessions { get; set; } = new();
        public required string CurrentSession { get; set; }
    }
}
