using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;

namespace ArasBackend.Application.Services;

public class ItemAppService
{
    private readonly IItemGateway _itemGateway;
    private readonly IWorkflowGateway _workflowGateway;
    private readonly IAssertionGateway _assertionGateway;
    private readonly IFileGateway _fileGateway;
    private readonly IUtilityGateway _utilityGateway;

    public ItemAppService(
        IItemGateway itemGateway,
        IWorkflowGateway workflowGateway,
        IAssertionGateway assertionGateway,
        IFileGateway fileGateway,
        IUtilityGateway utilityGateway)
    {
        _itemGateway = itemGateway;
        _workflowGateway = workflowGateway;
        _assertionGateway = assertionGateway;
        _fileGateway = fileGateway;
        _utilityGateway = utilityGateway;
    }

    public Task<ItemResponse> QueryItems(QueryRequest request, CancellationToken cancellationToken = default) => _itemGateway.QueryItems(request, cancellationToken);
    public Task<ItemResponse> GetItemById(GetByIdRequest request, CancellationToken cancellationToken = default) => _itemGateway.GetItemById(request, cancellationToken);
    public Task<ItemResponse> GetItemByKeyedName(GetByKeyedNameRequest request, CancellationToken cancellationToken = default) => _itemGateway.GetItemByKeyedName(request, cancellationToken);
    public Task<ItemResponse> CreateItem(CreateItemRequest request, CancellationToken cancellationToken = default) => _itemGateway.CreateItem(request, cancellationToken);
    public Task<ItemResponse> UpdateItem(UpdateItemRequest request, CancellationToken cancellationToken = default) => _itemGateway.UpdateItem(request, cancellationToken);
    public Task<ItemResponse> DeleteItem(DeleteItemRequest request, CancellationToken cancellationToken = default) => _itemGateway.DeleteItem(request, cancellationToken);
    public Task<ItemResponse> PurgeItem(DeleteItemRequest request, CancellationToken cancellationToken = default) => _itemGateway.PurgeItem(request, cancellationToken);
    
    public Task<ItemResponse> LockItem(LockRequest request, CancellationToken cancellationToken = default) => _itemGateway.LockItem(request, cancellationToken);
    public Task<ItemResponse> UnlockItem(LockRequest request, CancellationToken cancellationToken = default) => _itemGateway.UnlockItem(request, cancellationToken);
    public Task<ItemResponse> CheckLockStatus(LockRequest request, CancellationToken cancellationToken = default) => _itemGateway.CheckLockStatus(request, cancellationToken);
    
    public Task<ItemResponse> PromoteItem(PromoteRequest request, CancellationToken cancellationToken = default) => _itemGateway.PromoteItem(request, cancellationToken);
    public Task<ItemResponse> GetCurrentState(GetByIdRequest request, CancellationToken cancellationToken = default) => _itemGateway.GetCurrentState(request, cancellationToken);
    
    public Task<ItemResponse> AddRelationship(AddRelationshipRequest request, CancellationToken cancellationToken = default) => _itemGateway.AddRelationship(request, cancellationToken);
    public Task<ItemResponse> GetRelationships(GetRelationshipsRequest request, CancellationToken cancellationToken = default) => _itemGateway.GetRelationships(request, cancellationToken);
    public Task<ItemResponse> DeleteRelationship(DeleteRelationshipRequest request, CancellationToken cancellationToken = default) => _itemGateway.DeleteRelationship(request, cancellationToken);
    
    public Task<ItemResponse> ApplyAML(ApplyAmlRequest request, CancellationToken cancellationToken = default) => _utilityGateway.ApplyAML(request, cancellationToken);
    public Task<ItemResponse> ApplySQL(ApplySqlRequest request, CancellationToken cancellationToken = default) => _utilityGateway.ApplySQL(request, cancellationToken);
    public Task<ItemResponse> ApplyMethod(ApplyMethodRequest request, CancellationToken cancellationToken = default) => _utilityGateway.ApplyMethod(request, cancellationToken);
    
    public Task<AssertionResponse> AssertItemExists(AssertExistsRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertItemExists(request, cancellationToken);
    public Task<AssertionResponse> AssertItemNotExists(AssertExistsRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertItemNotExists(request, cancellationToken);
    public Task<AssertionResponse> AssertPropertyValue(AssertPropertyRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertPropertyValue(request, cancellationToken);
    public Task<AssertionResponse> AssertState(AssertStateRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertState(request, cancellationToken);
    
    // Workflow Operations
    public Task<ItemResponse> StartWorkflow(StartWorkflowRequest request, CancellationToken cancellationToken = default) => _workflowGateway.StartWorkflow(request, cancellationToken);
    public Task<ItemResponse> GetAssignedActivities(CancellationToken cancellationToken = default) => _workflowGateway.GetAssignedActivities(cancellationToken);
    public Task<ItemResponse> CompleteActivity(CompleteActivityRequest request, CancellationToken cancellationToken = default) => _workflowGateway.CompleteActivity(request, cancellationToken);
    
    // Additional Assertions
    public Task<AssertionResponse> AssertPropertyContains(AssertPropertyContainsRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertPropertyContains(request, cancellationToken);
    public Task<AssertionResponse> AssertCount(AssertCountRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertCount(request, cancellationToken);
    public Task<AssertionResponse> AssertLocked(LockRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertLocked(request, cancellationToken);
    public Task<AssertionResponse> AssertUnlocked(LockRequest request, CancellationToken cancellationToken = default) => _assertionGateway.AssertUnlocked(request, cancellationToken);
    
    // File Operations
    public Task<ItemResponse> UploadFile(UploadFileRequest request, CancellationToken cancellationToken = default) => _fileGateway.UploadFile(request, cancellationToken);
    public Task<ItemResponse> DownloadFile(DownloadFileRequest request, CancellationToken cancellationToken = default) => _fileGateway.DownloadFile(request, cancellationToken);
    public Task<AssertionResponse> VerifyFileExists(VerifyFileExistsRequest request, CancellationToken cancellationToken = default) => _assertionGateway.VerifyFileExists(request, cancellationToken);
    
    // Utility Operations
    public Task<ItemResponse> GenerateID(CancellationToken cancellationToken = default) => _utilityGateway.GenerateID(cancellationToken);
    public Task<ItemResponse> GetNextSequence(GetNextSequenceRequest request, CancellationToken cancellationToken = default) => _utilityGateway.GetNextSequence(request, cancellationToken);
    public Task<ItemResponse> Wait(WaitRequest request, CancellationToken cancellationToken = default) => _utilityGateway.Wait(request, cancellationToken);
    public Task<ItemResponse> SetVariable(SetVariableRequest request, CancellationToken cancellationToken = default) => _utilityGateway.SetVariable(request, cancellationToken);
    public Task<ItemResponse> LogMessage(LogMessageRequest request, CancellationToken cancellationToken = default) => _utilityGateway.LogMessage(request, cancellationToken);
}
