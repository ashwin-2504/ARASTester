using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Options;
using ArasBackend.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Gateways;

public class ItemGateway : BaseGateway, IItemGateway
{
    public ItemGateway(ArasSessionManager sessionManager, IOptions<GatewayResponseOptions> gatewayResponseOptions) : base(sessionManager, gatewayResponseOptions)
    {
    }

    public Task<ItemResponse> QueryItems(QueryRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            if (!string.IsNullOrEmpty(request.Select)) item.setAttribute("select", request.Select);
            item.setAttribute("page", request.Page.ToString());
            item.setAttribute("pagesize", request.PageSize.ToString());

            if (request.Criteria != null)
            {
                foreach (var kvp in request.Criteria)
                {
                    if (kvp.Value.Contains('%'))
                    {
                        item.setProperty(kvp.Key, kvp.Value);
                        item.setPropertyCondition(kvp.Key, "like");
                    }
                    else
                    {
                        item.setProperty(kvp.Key, kvp.Value);
                    }
                }
            }
            return item.apply();
        }, "Query successful"), cancellationToken);
    }

    public Task<ItemResponse> GetItemById(GetByIdRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            item.setID(request.Id);
            if (!string.IsNullOrEmpty(request.Select)) 
            {
                item.setAttribute("select", request.Select);
            }
            return item.apply();
        }, "Item retrieved"), cancellationToken);
    }

    public Task<ItemResponse> GetItemByKeyedName(GetByKeyedNameRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            item.setProperty("keyed_name", request.KeyedName);
            if (!string.IsNullOrEmpty(request.Select))
            {
                item.setAttribute("select", request.Select);
            }
            return item.apply();
        }, "Item retrieved"), cancellationToken);
    }

    public Task<ItemResponse> CreateItem(CreateItemRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "add");
            foreach (var prop in request.Properties)
                item.setProperty(prop.Key, prop.Value);
            return item.apply();
        }, "Item created successfully"), cancellationToken);
    }

    public Task<ItemResponse> UpdateItem(UpdateItemRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "edit");
            item.setID(request.Id);
            foreach (var prop in request.Properties)
                item.setProperty(prop.Key, prop.Value);
            return item.apply();
        }, "Item updated successfully"), cancellationToken);
    }

    public Task<ItemResponse> DeleteItem(DeleteItemRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "delete");
            item.setID(request.Id);
            return item.apply();
        }, "Item deleted successfully"), cancellationToken);
    }

    public Task<ItemResponse> PurgeItem(DeleteItemRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "purge");
            item.setID(request.Id);
            return item.apply();
        }, "Item purged successfully"), cancellationToken);
    }

    public Task<ItemResponse> LockItem(LockRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "lock");
            item.setID(request.Id);
            return item.apply();
        }, "Item locked successfully"), cancellationToken);
    }

    public Task<ItemResponse> UnlockItem(LockRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "unlock");
            item.setID(request.Id);
            return item.apply();
        }, "Item unlocked successfully"), cancellationToken);
    }

    public Task<ItemResponse> CheckLockStatus(LockRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => _sessionManager.Execute(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            item.setID(request.Id);
            item.setAttribute("select", "locked_by_id");
            
            var result = item.apply();
            if (result.isError())
                return new ItemResponse { Success = false, Message = result.getErrorString() };

            var lockedById = result.getProperty("locked_by_id", "");
            return new ItemResponse
            {
                Success = true,
                Message = string.IsNullOrEmpty(lockedById) ? "Item is unlocked" : "Item is locked",
                Data = new { isLocked = !string.IsNullOrEmpty(lockedById), lockedById }
            };
        }), cancellationToken);
    }

    public Task<ItemResponse> AddRelationship(AddRelationshipRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var rel = inn.newItem(request.RelationshipType, "add");
            rel.setProperty("source_id", request.ParentId);
            rel.setProperty("related_id", request.RelatedId);

            if (request.Properties != null)
            {
                foreach (var prop in request.Properties)
                    rel.setProperty(prop.Key, prop.Value);
            }
            return rel.apply();
        }, "Relationship created successfully"), cancellationToken);
    }

    public Task<ItemResponse> GetRelationships(GetRelationshipsRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var rel = inn.newItem(request.RelationshipType, "get");
            rel.setProperty("source_id", request.Id);
            if (!string.IsNullOrEmpty(request.Select))
                rel.setAttribute("select", request.Select);
            
            return rel.apply();
        }, "Relationships retrieved"), cancellationToken);
    }

    public Task<ItemResponse> DeleteRelationship(DeleteRelationshipRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var rel = inn.newItem(request.RelationshipType, "delete");
            rel.setID(request.RelationshipId);
            return rel.apply();
        }, "Relationship deleted successfully"), cancellationToken);
    }

    public Task<ItemResponse> PromoteItem(PromoteRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "promoteItem");
            item.setID(request.Id);
            item.setProperty("state", request.TargetState);
            if (!string.IsNullOrEmpty(request.Comments))
                item.setProperty("comments", request.Comments);
            return item.apply();
        }, $"Item promoted to {request.TargetState}"), cancellationToken);
    }

    public Task<ItemResponse> GetCurrentState(GetByIdRequest request, CancellationToken cancellationToken = default)
    {
         return RunAsync(() => _sessionManager.Execute(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            item.setID(request.Id);
            item.setAttribute("select", "state");
            
            var result = item.apply();

            if (result.isError())
                return new ItemResponse { Success = false, Message = result.getErrorString() };

            var state = result.getProperty("state", "Unknown");
            return new ItemResponse
            {
                Success = true,
                Message = $"Current state: {state}",
                Data = new { state }
            };
        }), cancellationToken);
    }
}
