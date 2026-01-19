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
    
    public ItemResponse ApplyAML(ApplyAmlRequest request) => _gateway.ApplyAML(request);
    public ItemResponse ApplySQL(ApplySqlRequest request) => _gateway.ApplySQL(request);
    
    public AssertionResponse AssertItemExists(AssertExistsRequest request) => _gateway.AssertItemExists(request);
    public AssertionResponse AssertItemNotExists(AssertExistsRequest request) => _gateway.AssertItemNotExists(request);
    public AssertionResponse AssertPropertyValue(AssertPropertyRequest request) => _gateway.AssertPropertyValue(request);
    public AssertionResponse AssertState(AssertStateRequest request) => _gateway.AssertState(request);
}
