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
    
    ItemResponse AddRelationship(AddRelationshipRequest request);
    ItemResponse GetRelationships(GetRelationshipsRequest request);
    ItemResponse DeleteRelationship(DeleteRelationshipRequest request);
    
    ItemResponse PromoteItem(PromoteRequest request);
    ItemResponse GetCurrentState(GetByIdRequest request);

    ItemResponse StartWorkflow(StartWorkflowRequest request);
    ItemResponse GetAssignedActivities();
    ItemResponse CompleteActivity(CompleteActivityRequest request);
    
    ItemResponse ApplyAML(ApplyAmlRequest request);
    ItemResponse ApplySQL(ApplySqlRequest request);
    ItemResponse ApplyMethod(ApplyMethodRequest request);
    
    AssertionResponse AssertItemExists(AssertExistsRequest request);
    AssertionResponse AssertItemNotExists(AssertExistsRequest request);
    AssertionResponse AssertPropertyValue(AssertPropertyRequest request);
    AssertionResponse AssertPropertyContains(AssertPropertyContainsRequest request);
    AssertionResponse AssertState(AssertStateRequest request);
    AssertionResponse AssertCount(AssertCountRequest request);
    AssertionResponse AssertLocked(LockRequest request);
    AssertionResponse AssertUnlocked(LockRequest request);

    ItemResponse UploadFile(UploadFileRequest request);
    ItemResponse DownloadFile(DownloadFileRequest request);
    AssertionResponse VerifyFileExists(VerifyFileExistsRequest request);

    ItemResponse GenerateID();
    ItemResponse GetNextSequence(GetNextSequenceRequest request);
    ItemResponse Wait(WaitRequest request);
    ItemResponse SetVariable(SetVariableRequest request);
    ItemResponse LogMessage(LogMessageRequest request);
}
