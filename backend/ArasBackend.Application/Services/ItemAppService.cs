using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;

namespace ArasBackend.Application.Services;

public class ItemAppService
{
    private readonly IArasGateway _gateway;

    public ItemAppService(IArasGateway gateway)
    {
        _gateway = gateway;
    }

    public Task<ItemResponse> QueryItems(QueryRequest request, CancellationToken cancellationToken = default) => _gateway.QueryItems(request, cancellationToken);
    public Task<ItemResponse> GetItemById(GetByIdRequest request, CancellationToken cancellationToken = default) => _gateway.GetItemById(request, cancellationToken);
    public Task<ItemResponse> GetItemByKeyedName(GetByKeyedNameRequest request, CancellationToken cancellationToken = default) => _gateway.GetItemByKeyedName(request, cancellationToken);
    public Task<ItemResponse> CreateItem(CreateItemRequest request, CancellationToken cancellationToken = default) => _gateway.CreateItem(request, cancellationToken);
    public Task<ItemResponse> UpdateItem(UpdateItemRequest request, CancellationToken cancellationToken = default) => _gateway.UpdateItem(request, cancellationToken);
    public Task<ItemResponse> DeleteItem(DeleteItemRequest request, CancellationToken cancellationToken = default) => _gateway.DeleteItem(request, cancellationToken);
    public Task<ItemResponse> PurgeItem(DeleteItemRequest request, CancellationToken cancellationToken = default) => _gateway.PurgeItem(request, cancellationToken);
    
    public Task<ItemResponse> LockItem(LockRequest request, CancellationToken cancellationToken = default) => _gateway.LockItem(request, cancellationToken);
    public Task<ItemResponse> UnlockItem(LockRequest request, CancellationToken cancellationToken = default) => _gateway.UnlockItem(request, cancellationToken);
    public Task<ItemResponse> CheckLockStatus(LockRequest request, CancellationToken cancellationToken = default) => _gateway.CheckLockStatus(request, cancellationToken);
    
    public Task<ItemResponse> PromoteItem(PromoteRequest request, CancellationToken cancellationToken = default) => _gateway.PromoteItem(request, cancellationToken);
    public Task<ItemResponse> GetCurrentState(GetByIdRequest request, CancellationToken cancellationToken = default) => _gateway.GetCurrentState(request, cancellationToken);
    
    public Task<ItemResponse> AddRelationship(AddRelationshipRequest request, CancellationToken cancellationToken = default) => _gateway.AddRelationship(request, cancellationToken);
    public Task<ItemResponse> GetRelationships(GetRelationshipsRequest request, CancellationToken cancellationToken = default) => _gateway.GetRelationships(request, cancellationToken);
    public Task<ItemResponse> DeleteRelationship(DeleteRelationshipRequest request, CancellationToken cancellationToken = default) => _gateway.DeleteRelationship(request, cancellationToken);
    
    public Task<ItemResponse> ApplyAML(ApplyAmlRequest request, CancellationToken cancellationToken = default) => _gateway.ApplyAML(request, cancellationToken);
    public Task<ItemResponse> ApplySQL(ApplySqlRequest request, CancellationToken cancellationToken = default) => _gateway.ApplySQL(request, cancellationToken);
    public Task<ItemResponse> ApplyMethod(ApplyMethodRequest request, CancellationToken cancellationToken = default) => _gateway.ApplyMethod(request, cancellationToken);
    
    public Task<AssertionResponse> AssertItemExists(AssertExistsRequest request, CancellationToken cancellationToken = default) => _gateway.AssertItemExists(request, cancellationToken);
    public Task<AssertionResponse> AssertItemNotExists(AssertExistsRequest request, CancellationToken cancellationToken = default) => _gateway.AssertItemNotExists(request, cancellationToken);
    public Task<AssertionResponse> AssertPropertyValue(AssertPropertyRequest request, CancellationToken cancellationToken = default) => _gateway.AssertPropertyValue(request, cancellationToken);
    public Task<AssertionResponse> AssertState(AssertStateRequest request, CancellationToken cancellationToken = default) => _gateway.AssertState(request, cancellationToken);
    
    // Workflow Operations
    public Task<ItemResponse> StartWorkflow(StartWorkflowRequest request, CancellationToken cancellationToken = default) => _gateway.StartWorkflow(request, cancellationToken);
    public Task<ItemResponse> GetAssignedActivities(CancellationToken cancellationToken = default) => _gateway.GetAssignedActivities(cancellationToken);
    public Task<ItemResponse> CompleteActivity(CompleteActivityRequest request, CancellationToken cancellationToken = default) => _gateway.CompleteActivity(request, cancellationToken);
    
    // Additional Assertions
    public Task<AssertionResponse> AssertPropertyContains(AssertPropertyContainsRequest request, CancellationToken cancellationToken = default) => _gateway.AssertPropertyContains(request, cancellationToken);
    public Task<AssertionResponse> AssertCount(AssertCountRequest request, CancellationToken cancellationToken = default) => _gateway.AssertCount(request, cancellationToken);
    public Task<AssertionResponse> AssertLocked(LockRequest request, CancellationToken cancellationToken = default) => _gateway.AssertLocked(request, cancellationToken);
    public Task<AssertionResponse> AssertUnlocked(LockRequest request, CancellationToken cancellationToken = default) => _gateway.AssertUnlocked(request, cancellationToken);
    
    // File Operations
    public Task<ItemResponse> UploadFile(UploadFileRequest request, CancellationToken cancellationToken = default) => _gateway.UploadFile(request, cancellationToken);
    public Task<ItemResponse> DownloadFile(DownloadFileRequest request, CancellationToken cancellationToken = default) => _gateway.DownloadFile(request, cancellationToken);
    public Task<AssertionResponse> VerifyFileExists(VerifyFileExistsRequest request, CancellationToken cancellationToken = default) => _gateway.VerifyFileExists(request, cancellationToken);
    
    // Utility Operations
    public Task<ItemResponse> GenerateID(CancellationToken cancellationToken = default) => _gateway.GenerateID(cancellationToken);
    public Task<ItemResponse> GetNextSequence(GetNextSequenceRequest request, CancellationToken cancellationToken = default) => _gateway.GetNextSequence(request, cancellationToken);
    public Task<ItemResponse> Wait(WaitRequest request, CancellationToken cancellationToken = default) => _gateway.Wait(request, cancellationToken);
    public Task<ItemResponse> SetVariable(SetVariableRequest request, CancellationToken cancellationToken = default) => _gateway.SetVariable(request, cancellationToken);
    public Task<ItemResponse> LogMessage(LogMessageRequest request, CancellationToken cancellationToken = default) => _gateway.LogMessage(request, cancellationToken);
}
