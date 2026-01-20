using Microsoft.AspNetCore.Mvc;
using global::ArasBackend.Application.Services;
using global::ArasBackend.Core.Models;

namespace ArasBackend.Controllers;

[ApiController]
[Route("api/aras")]
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
}
