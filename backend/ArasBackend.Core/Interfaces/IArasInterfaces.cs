using ArasBackend.Core.Models;

namespace ArasBackend.Core.Interfaces;

public interface IArasSessionManager
{
    ConnectionResponse Connect(ConnectionRequest request);
    ConnectionResponse Disconnect();
    ConnectionResponse ValidateConnection();
    ConnectionStatusResponse GetStatus();
    bool IsConnected { get; }
}

public interface IArasGateway
{
    ItemResponse QueryItems(QueryRequest request);
    ItemResponse GetItemById(GetByIdRequest request);
    ItemResponse GetItemByKeyedName(GetByKeyedNameRequest request);
    ItemResponse CreateItem(CreateItemRequest request);
    ItemResponse UpdateItem(UpdateItemRequest request);
    ItemResponse DeleteItem(DeleteItemRequest request);
    ItemResponse PurgeItem(DeleteItemRequest request);
    
    ItemResponse LockItem(LockRequest request);
    ItemResponse UnlockItem(LockRequest request);
    ItemResponse CheckLockStatus(LockRequest request);
    
    ItemResponse PromoteItem(PromoteRequest request);
    ItemResponse GetCurrentState(GetByIdRequest request);
    
    ItemResponse ApplyAML(ApplyAmlRequest request);
    ItemResponse ApplySQL(ApplySqlRequest request);
    
    AssertionResponse AssertItemExists(AssertExistsRequest request);
    AssertionResponse AssertItemNotExists(AssertExistsRequest request);
    AssertionResponse AssertPropertyValue(AssertPropertyRequest request);
    AssertionResponse AssertState(AssertStateRequest request);
}
