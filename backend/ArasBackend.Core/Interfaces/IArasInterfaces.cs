using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Models;

namespace ArasBackend.Core.Interfaces;

public interface IArasSessionManager
{
    Task<ConnectionResponse> Connect(ConnectionRequest request, CancellationToken cancellationToken = default);
    Task<ConnectionResponse> Disconnect(CancellationToken cancellationToken = default);
    Task<ConnectionResponse> DisconnectSession(string sessionName, CancellationToken cancellationToken = default);
    Task<AllSessionsResponse> GetAllSessions(CancellationToken cancellationToken = default);
    Task<ConnectionResponse> ValidateConnection(CancellationToken cancellationToken = default);
    Task<ConnectionStatusResponse> GetStatus(CancellationToken cancellationToken = default);
    bool IsConnected { get; }
}

public interface IArasGateway
{
    Task<ItemResponse> QueryItems(QueryRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> GetItemById(GetByIdRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> GetItemByKeyedName(GetByKeyedNameRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> CreateItem(CreateItemRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> UpdateItem(UpdateItemRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> DeleteItem(DeleteItemRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> PurgeItem(DeleteItemRequest request, CancellationToken cancellationToken = default);
    
    Task<ItemResponse> LockItem(LockRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> UnlockItem(LockRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> CheckLockStatus(LockRequest request, CancellationToken cancellationToken = default);
    
    Task<ItemResponse> AddRelationship(AddRelationshipRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> GetRelationships(GetRelationshipsRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> DeleteRelationship(DeleteRelationshipRequest request, CancellationToken cancellationToken = default);
    
    Task<ItemResponse> PromoteItem(PromoteRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> GetCurrentState(GetByIdRequest request, CancellationToken cancellationToken = default);

    Task<ItemResponse> StartWorkflow(StartWorkflowRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> GetAssignedActivities(CancellationToken cancellationToken = default);
    Task<ItemResponse> CompleteActivity(CompleteActivityRequest request, CancellationToken cancellationToken = default);
    
    Task<ItemResponse> ApplyAML(ApplyAmlRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> ApplySQL(ApplySqlRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> ApplyMethod(ApplyMethodRequest request, CancellationToken cancellationToken = default);
    
    Task<AssertionResponse> AssertItemExists(AssertExistsRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> AssertItemNotExists(AssertExistsRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> AssertPropertyValue(AssertPropertyRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> AssertPropertyContains(AssertPropertyContainsRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> AssertState(AssertStateRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> AssertCount(AssertCountRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> AssertLocked(LockRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> AssertUnlocked(LockRequest request, CancellationToken cancellationToken = default);

    Task<ItemResponse> UploadFile(UploadFileRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> DownloadFile(DownloadFileRequest request, CancellationToken cancellationToken = default);
    Task<AssertionResponse> VerifyFileExists(VerifyFileExistsRequest request, CancellationToken cancellationToken = default);

    Task<ItemResponse> GenerateID(CancellationToken cancellationToken = default);
    Task<ItemResponse> GetNextSequence(GetNextSequenceRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> Wait(WaitRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> SetVariable(SetVariableRequest request, CancellationToken cancellationToken = default);
    Task<ItemResponse> LogMessage(LogMessageRequest request, CancellationToken cancellationToken = default);
}
