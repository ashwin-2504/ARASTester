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
    public ActionResult<ItemResponse> Query(QueryRequest request) => Ok(_itemService.QueryItems(request));

    [HttpPost("get-by-id")]
    public ActionResult<ItemResponse> GetById(GetByIdRequest request) => Ok(_itemService.GetItemById(request));

    [HttpPost("get-by-keyed-name")]
    public ActionResult<ItemResponse> GetByKeyedName(GetByKeyedNameRequest request) => Ok(_itemService.GetItemByKeyedName(request));

    [HttpPost("create")]
    public ActionResult<ItemResponse> Create(CreateItemRequest request) => Ok(_itemService.CreateItem(request));

    [HttpPost("update")]
    public ActionResult<ItemResponse> Update(UpdateItemRequest request) => Ok(_itemService.UpdateItem(request));

    [HttpPost("delete")]
    public ActionResult<ItemResponse> Delete(DeleteItemRequest request) => Ok(_itemService.DeleteItem(request));

    [HttpPost("purge")]
    public ActionResult<ItemResponse> Purge(DeleteItemRequest request) => Ok(_itemService.PurgeItem(request));

    [HttpPost("lock")]
    public ActionResult<ItemResponse> Lock(LockRequest request) => Ok(_itemService.LockItem(request));

    [HttpPost("unlock")]
    public ActionResult<ItemResponse> Unlock(LockRequest request) => Ok(_itemService.UnlockItem(request));

    [HttpPost("check-lock")]
    public ActionResult<ItemResponse> CheckLock(LockRequest request) => Ok(_itemService.CheckLockStatus(request));

    [HttpPost("promote")]
    public ActionResult<ItemResponse> Promote(PromoteRequest request) => Ok(_itemService.PromoteItem(request));

    [HttpPost("get-state")]
    public ActionResult<ItemResponse> GetState(GetByIdRequest request) => Ok(_itemService.GetCurrentState(request));

    [HttpPost("add-relationship")]
    public ActionResult<ItemResponse> AddRelationship(AddRelationshipRequest request) => Ok(_itemService.AddRelationship(request));

    [HttpPost("get-relationships")]
    public ActionResult<ItemResponse> GetRelationships(GetRelationshipsRequest request) => Ok(_itemService.GetRelationships(request));

    [HttpPost("delete-relationship")]
    public ActionResult<ItemResponse> DeleteRelationship(DeleteRelationshipRequest request) => Ok(_itemService.DeleteRelationship(request));

    [HttpPost("apply-aml")]
    public ActionResult<ItemResponse> ApplyAml(ApplyAmlRequest request) => Ok(_itemService.ApplyAML(request));

    [HttpPost("apply-sql")]
    public ActionResult<ItemResponse> ApplySql(ApplySqlRequest request) => Ok(_itemService.ApplySQL(request));

    [HttpPost("apply-method")]
    public ActionResult<ItemResponse> ApplyMethod(ApplyMethodRequest request) => Ok(_itemService.ApplyMethod(request));

    // Assertions
    [HttpPost("assert-exists")]
    public ActionResult<AssertionResponse> AssertExists(AssertExistsRequest request) => Ok(_itemService.AssertItemExists(request));

    [HttpPost("assert-not-exists")]
    public ActionResult<AssertionResponse> AssertNotExists(AssertExistsRequest request) => Ok(_itemService.AssertItemNotExists(request));

    [HttpPost("assert-property")]
    public ActionResult<AssertionResponse> AssertProperty(AssertPropertyRequest request) => Ok(_itemService.AssertPropertyValue(request));

    [HttpPost("assert-state")]
    public ActionResult<AssertionResponse> AssertState(AssertStateRequest request) => Ok(_itemService.AssertState(request));

    // Workflow Operations
    [HttpPost("start-workflow")]
    public ActionResult<ItemResponse> StartWorkflow(StartWorkflowRequest request) => Ok(_itemService.StartWorkflow(request));

    [HttpGet("assigned-activities")]
    public ActionResult<ItemResponse> GetAssignedActivities() => Ok(_itemService.GetAssignedActivities());

    [HttpPost("complete-activity")]
    public ActionResult<ItemResponse> CompleteActivity(CompleteActivityRequest request) => Ok(_itemService.CompleteActivity(request));

    // Additional Assertions
    [HttpPost("assert-property-contains")]
    public ActionResult<AssertionResponse> AssertPropertyContains(AssertPropertyContainsRequest request) => Ok(_itemService.AssertPropertyContains(request));

    [HttpPost("assert-count")]
    public ActionResult<AssertionResponse> AssertCount(AssertCountRequest request) => Ok(_itemService.AssertCount(request));

    [HttpPost("assert-locked")]
    public ActionResult<AssertionResponse> AssertLocked(LockRequest request) => Ok(_itemService.AssertLocked(request));

    [HttpPost("assert-unlocked")]
    public ActionResult<AssertionResponse> AssertUnlocked(LockRequest request) => Ok(_itemService.AssertUnlocked(request));

    // File Operations
    [HttpPost("upload-file")]
    public ActionResult<ItemResponse> UploadFile(UploadFileRequest request) => Ok(_itemService.UploadFile(request));

    [HttpPost("download-file")]
    public ActionResult<ItemResponse> DownloadFile(DownloadFileRequest request) => Ok(_itemService.DownloadFile(request));

    [HttpPost("verify-file-exists")]
    public ActionResult<AssertionResponse> VerifyFileExists(VerifyFileExistsRequest request) => Ok(_itemService.VerifyFileExists(request));

    // Utility Operations
    [HttpPost("generate-id")]
    public ActionResult<ItemResponse> GenerateId() => Ok(_itemService.GenerateID());

    [HttpPost("get-next-sequence")]
    public ActionResult<ItemResponse> GetNextSequence(GetNextSequenceRequest request) => Ok(_itemService.GetNextSequence(request));

    [HttpPost("wait")]
    public async Task<ActionResult<ItemResponse>> Wait(WaitRequest request, CancellationToken cancellationToken) => Ok(await _itemService.Wait(request, cancellationToken));

    [HttpPost("set-variable")]
    public ActionResult<ItemResponse> SetVariable(SetVariableRequest request) => Ok(_itemService.SetVariable(request));

    [HttpPost("log-message")]
    public ActionResult<ItemResponse> LogMessage(LogMessageRequest request) => Ok(_itemService.LogMessage(request));
}
