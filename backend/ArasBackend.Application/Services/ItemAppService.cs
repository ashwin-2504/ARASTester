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

    public ItemResponse QueryItems(QueryRequest request) => _gateway.QueryItems(request);
    public ItemResponse GetItemById(GetByIdRequest request) => _gateway.GetItemById(request);
    public ItemResponse GetItemByKeyedName(GetByKeyedNameRequest request) => _gateway.GetItemByKeyedName(request);
    public ItemResponse CreateItem(CreateItemRequest request) => _gateway.CreateItem(request);
    public ItemResponse UpdateItem(UpdateItemRequest request) => _gateway.UpdateItem(request);
    public ItemResponse DeleteItem(DeleteItemRequest request) => _gateway.DeleteItem(request);
    public ItemResponse PurgeItem(DeleteItemRequest request) => _gateway.PurgeItem(request);
    
    public ItemResponse LockItem(LockRequest request) => _gateway.LockItem(request);
    public ItemResponse UnlockItem(LockRequest request) => _gateway.UnlockItem(request);
    public ItemResponse CheckLockStatus(LockRequest request) => _gateway.CheckLockStatus(request);
    
    public ItemResponse PromoteItem(PromoteRequest request) => _gateway.PromoteItem(request);
    public ItemResponse GetCurrentState(GetByIdRequest request) => _gateway.GetCurrentState(request);
    
    public ItemResponse AddRelationship(AddRelationshipRequest request) => _gateway.AddRelationship(request);
    public ItemResponse GetRelationships(GetRelationshipsRequest request) => _gateway.GetRelationships(request);
    public ItemResponse DeleteRelationship(DeleteRelationshipRequest request) => _gateway.DeleteRelationship(request);
    
    public ItemResponse ApplyAML(ApplyAmlRequest request) => _gateway.ApplyAML(request);
    public ItemResponse ApplySQL(ApplySqlRequest request) => _gateway.ApplySQL(request);
    public ItemResponse ApplyMethod(ApplyMethodRequest request) => _gateway.ApplyMethod(request);
    
    public AssertionResponse AssertItemExists(AssertExistsRequest request) => _gateway.AssertItemExists(request);
    public AssertionResponse AssertItemNotExists(AssertExistsRequest request) => _gateway.AssertItemNotExists(request);
    public AssertionResponse AssertPropertyValue(AssertPropertyRequest request) => _gateway.AssertPropertyValue(request);
    public AssertionResponse AssertState(AssertStateRequest request) => _gateway.AssertState(request);
    
    // Workflow Operations
    public ItemResponse StartWorkflow(StartWorkflowRequest request) => _gateway.StartWorkflow(request);
    public ItemResponse GetAssignedActivities() => _gateway.GetAssignedActivities();
    public ItemResponse CompleteActivity(CompleteActivityRequest request) => _gateway.CompleteActivity(request);
    
    // Additional Assertions
    public AssertionResponse AssertPropertyContains(AssertPropertyContainsRequest request) => _gateway.AssertPropertyContains(request);
    public AssertionResponse AssertCount(AssertCountRequest request) => _gateway.AssertCount(request);
    public AssertionResponse AssertLocked(LockRequest request) => _gateway.AssertLocked(request);
    public AssertionResponse AssertUnlocked(LockRequest request) => _gateway.AssertUnlocked(request);
    
    // File Operations
    public ItemResponse UploadFile(UploadFileRequest request) => _gateway.UploadFile(request);
    public ItemResponse DownloadFile(DownloadFileRequest request) => _gateway.DownloadFile(request);
    public AssertionResponse VerifyFileExists(VerifyFileExistsRequest request) => _gateway.VerifyFileExists(request);
    
    // Utility Operations
    public ItemResponse GenerateID() => _gateway.GenerateID();
    public ItemResponse GetNextSequence(GetNextSequenceRequest request) => _gateway.GetNextSequence(request);
    public async Task<ItemResponse> Wait(WaitRequest request, CancellationToken cancellationToken = default) => await _gateway.Wait(request, cancellationToken);
    public ItemResponse SetVariable(SetVariableRequest request) => _gateway.SetVariable(request);
    public ItemResponse LogMessage(LogMessageRequest request) => _gateway.LogMessage(request);
}
