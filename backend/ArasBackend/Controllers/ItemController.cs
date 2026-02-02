using Microsoft.AspNetCore.Mvc;
using global::ArasBackend.Application.Services;
using global::ArasBackend.Core.Models;

namespace ArasBackend.Controllers;

[ApiController]
[Route("api/aras")]
[ServiceFilter(typeof(Middleware.ArasAuthorizeAttribute))]
public class ItemController : ControllerBase
{
    private readonly ItemAppService _itemService;

    public ItemController(ItemAppService itemService)
    {
        _itemService = itemService;
    }

    [HttpPost("query")]
    public async Task<ActionResult<ItemResponse>> Query(QueryRequest request, CancellationToken cancellationToken) => Ok(await _itemService.QueryItems(request, cancellationToken));

    [HttpPost("get-by-id")]
    public async Task<ActionResult<ItemResponse>> GetById(GetByIdRequest request, CancellationToken cancellationToken) => Ok(await _itemService.GetItemById(request, cancellationToken));

    [HttpPost("get-by-keyed-name")]
    public async Task<ActionResult<ItemResponse>> GetByKeyedName(GetByKeyedNameRequest request, CancellationToken cancellationToken) => Ok(await _itemService.GetItemByKeyedName(request, cancellationToken));

    [HttpPost("create")]
    public async Task<ActionResult<ItemResponse>> Create(CreateItemRequest request, CancellationToken cancellationToken) => Ok(await _itemService.CreateItem(request, cancellationToken));

    [HttpPost("update")]
    public async Task<ActionResult<ItemResponse>> Update(UpdateItemRequest request, CancellationToken cancellationToken) => Ok(await _itemService.UpdateItem(request, cancellationToken));

    [HttpPost("delete")]
    public async Task<ActionResult<ItemResponse>> Delete(DeleteItemRequest request, CancellationToken cancellationToken) => Ok(await _itemService.DeleteItem(request, cancellationToken));

    [HttpPost("purge")]
    public async Task<ActionResult<ItemResponse>> Purge(DeleteItemRequest request, CancellationToken cancellationToken) => Ok(await _itemService.PurgeItem(request, cancellationToken));

    [HttpPost("lock")]
    public async Task<ActionResult<ItemResponse>> Lock(LockRequest request, CancellationToken cancellationToken) => Ok(await _itemService.LockItem(request, cancellationToken));

    [HttpPost("unlock")]
    public async Task<ActionResult<ItemResponse>> Unlock(LockRequest request, CancellationToken cancellationToken) => Ok(await _itemService.UnlockItem(request, cancellationToken));

    [HttpPost("check-lock")]
    public async Task<ActionResult<ItemResponse>> CheckLock(LockRequest request, CancellationToken cancellationToken) => Ok(await _itemService.CheckLockStatus(request, cancellationToken));

    [HttpPost("promote")]
    public async Task<ActionResult<ItemResponse>> Promote(PromoteRequest request, CancellationToken cancellationToken) => Ok(await _itemService.PromoteItem(request, cancellationToken));

    [HttpPost("get-state")]
    public async Task<ActionResult<ItemResponse>> GetState(GetByIdRequest request, CancellationToken cancellationToken) => Ok(await _itemService.GetCurrentState(request, cancellationToken));

    [HttpPost("add-relationship")]
    public async Task<ActionResult<ItemResponse>> AddRelationship(AddRelationshipRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AddRelationship(request, cancellationToken));

    [HttpPost("get-relationships")]
    public async Task<ActionResult<ItemResponse>> GetRelationships(GetRelationshipsRequest request, CancellationToken cancellationToken) => Ok(await _itemService.GetRelationships(request, cancellationToken));

    [HttpPost("delete-relationship")]
    public async Task<ActionResult<ItemResponse>> DeleteRelationship(DeleteRelationshipRequest request, CancellationToken cancellationToken) => Ok(await _itemService.DeleteRelationship(request, cancellationToken));

    [HttpPost("apply-aml")]
    public async Task<ActionResult<ItemResponse>> ApplyAml(ApplyAmlRequest request, CancellationToken cancellationToken) => Ok(await _itemService.ApplyAML(request, cancellationToken));

    [HttpPost("apply-sql")]
    public async Task<ActionResult<ItemResponse>> ApplySql(ApplySqlRequest request, CancellationToken cancellationToken) => Ok(await _itemService.ApplySQL(request, cancellationToken));

    [HttpPost("apply-method")]
    public async Task<ActionResult<ItemResponse>> ApplyMethod(ApplyMethodRequest request, CancellationToken cancellationToken) => Ok(await _itemService.ApplyMethod(request, cancellationToken));

    // Assertions
    [HttpPost("assert-exists")]
    public async Task<ActionResult<AssertionResponse>> AssertExists(AssertExistsRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertItemExists(request, cancellationToken));

    [HttpPost("assert-not-exists")]
    public async Task<ActionResult<AssertionResponse>> AssertNotExists(AssertExistsRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertItemNotExists(request, cancellationToken));

    [HttpPost("assert-property")]
    public async Task<ActionResult<AssertionResponse>> AssertProperty(AssertPropertyRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertPropertyValue(request, cancellationToken));

    [HttpPost("assert-state")]
    public async Task<ActionResult<AssertionResponse>> AssertState(AssertStateRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertState(request, cancellationToken));

    // Workflow Operations
    [HttpPost("start-workflow")]
    public async Task<ActionResult<ItemResponse>> StartWorkflow(StartWorkflowRequest request, CancellationToken cancellationToken) => Ok(await _itemService.StartWorkflow(request, cancellationToken));

    [HttpGet("assigned-activities")]
    public async Task<ActionResult<ItemResponse>> GetAssignedActivities(CancellationToken cancellationToken) => Ok(await _itemService.GetAssignedActivities(cancellationToken));

    [HttpPost("complete-activity")]
    public async Task<ActionResult<ItemResponse>> CompleteActivity(CompleteActivityRequest request, CancellationToken cancellationToken) => Ok(await _itemService.CompleteActivity(request, cancellationToken));

    // Additional Assertions
    [HttpPost("assert-property-contains")]
    public async Task<ActionResult<AssertionResponse>> AssertPropertyContains(AssertPropertyContainsRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertPropertyContains(request, cancellationToken));

    [HttpPost("assert-count")]
    public async Task<ActionResult<AssertionResponse>> AssertCount(AssertCountRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertCount(request, cancellationToken));

    [HttpPost("assert-locked")]
    public async Task<ActionResult<AssertionResponse>> AssertLocked(LockRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertLocked(request, cancellationToken));

    [HttpPost("assert-unlocked")]
    public async Task<ActionResult<AssertionResponse>> AssertUnlocked(LockRequest request, CancellationToken cancellationToken) => Ok(await _itemService.AssertUnlocked(request, cancellationToken));

    // File Operations
    [HttpPost("upload-file")]
    public async Task<ActionResult<ItemResponse>> UploadFile(UploadFileRequest request, CancellationToken cancellationToken) => Ok(await _itemService.UploadFile(request, cancellationToken));

    [HttpPost("download-file")]
    public async Task<ActionResult<ItemResponse>> DownloadFile(DownloadFileRequest request, CancellationToken cancellationToken) => Ok(await _itemService.DownloadFile(request, cancellationToken));

    [HttpPost("verify-file-exists")]
    public async Task<ActionResult<AssertionResponse>> VerifyFileExists(VerifyFileExistsRequest request, CancellationToken cancellationToken) => Ok(await _itemService.VerifyFileExists(request, cancellationToken));

    // Utility Operations
    [HttpPost("generate-id")]
    public async Task<ActionResult<ItemResponse>> GenerateId(CancellationToken cancellationToken) => Ok(await _itemService.GenerateID(cancellationToken));

    [HttpPost("get-next-sequence")]
    public async Task<ActionResult<ItemResponse>> GetNextSequence(GetNextSequenceRequest request, CancellationToken cancellationToken) => Ok(await _itemService.GetNextSequence(request, cancellationToken));

    [HttpPost("wait")]
    public async Task<ActionResult<ItemResponse>> Wait(WaitRequest request, CancellationToken cancellationToken) => Ok(await _itemService.Wait(request, cancellationToken));

    [HttpPost("set-variable")]
    public async Task<ActionResult<ItemResponse>> SetVariable(SetVariableRequest request, CancellationToken cancellationToken) => Ok(await _itemService.SetVariable(request, cancellationToken));

    [HttpPost("log-message")]
    public async Task<ActionResult<ItemResponse>> LogMessage(LogMessageRequest request, CancellationToken cancellationToken) => Ok(await _itemService.LogMessage(request, cancellationToken));
}
