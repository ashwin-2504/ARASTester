using Aras.IOM;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Core.Exceptions;

namespace ArasBackend.Infrastructure.Gateways;

using Services; // Access ArasSessionManager

public class ArasGateway : IArasGateway
{
    private readonly ArasSessionManager _sessionManager;

    public ArasGateway(ArasSessionManager sessionManager)
    {
        _sessionManager = sessionManager;
    }

    private ItemResponse ExecuteIom(Func<Innovator, Item> action, string successMessage = "Success")
    {
        return _sessionManager.Execute(inn =>
        {
            var result = action(inn);
            if (result.isError())
            {
                return new ItemResponse { Success = false, Message = result.getErrorString() };
            }

            return new ItemResponse
            {
                Success = true,
                Message = successMessage,
                Data = result.dom?.OuterXml,
                ItemCount = result.getItemCount()
            };
        });
    }

    private AssertionResponse ExecuteAssertion(Func<Innovator, AssertionResponse> action)
    {
        return _sessionManager.Execute(action);
    }

    public ItemResponse QueryItems(QueryRequest request)
    {
        return ExecuteIom(inn =>
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
        }, "Query successful");
    }

    public ItemResponse GetItemById(GetByIdRequest request)
    {
        return ExecuteIom(inn => inn.getItemById(request.ItemType, request.Id), "Item retrieved");
    }

    public ItemResponse GetItemByKeyedName(GetByKeyedNameRequest request)
    {
        return ExecuteIom(inn => inn.getItemByKeyedName(request.ItemType, request.KeyedName), "Item retrieved");
    }

    public ItemResponse CreateItem(CreateItemRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "add");
            foreach (var prop in request.Properties)
                item.setProperty(prop.Key, prop.Value);
            return item.apply();
        }, "Item created successfully");
    }

    public ItemResponse UpdateItem(UpdateItemRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "edit");
            item.setID(request.Id);
            foreach (var prop in request.Properties)
                item.setProperty(prop.Key, prop.Value);
            return item.apply();
        }, "Item updated successfully");
    }

    public ItemResponse DeleteItem(DeleteItemRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "delete");
            item.setID(request.Id);
            return item.apply();
        }, "Item deleted successfully");
    }

    public ItemResponse PurgeItem(DeleteItemRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "purge");
            item.setID(request.Id);
            return item.apply();
        }, "Item purged successfully");
    }

    public ItemResponse LockItem(LockRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return item;
            return item.lockItem();
        }, "Item locked successfully");
    }

    public ItemResponse UnlockItem(LockRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return item;
            return item.unlockItem();
        }, "Item unlocked successfully");
    }

    public ItemResponse CheckLockStatus(LockRequest request)
    {
        // Custom logic for CheckLockStatus as it returns specific Data structure
        return _sessionManager.Execute(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError())
                return new ItemResponse { Success = false, Message = item.getErrorString() };

            var lockedById = item.getProperty("locked_by_id", "");
            return new ItemResponse
            {
                Success = true,
                Message = string.IsNullOrEmpty(lockedById) ? "Item is unlocked" : "Item is locked",
                Data = new { isLocked = !string.IsNullOrEmpty(lockedById), lockedById }
            };
        });
    }

    public ItemResponse PromoteItem(PromoteRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return item;
            return item.promote(request.TargetState, request.Comments ?? "");
        }, $"Item promoted to {request.TargetState}");
    }

    public ItemResponse GetCurrentState(GetByIdRequest request)
    {
         return _sessionManager.Execute(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError())
                return new ItemResponse { Success = false, Message = item.getErrorString() };

            var state = item.getProperty("state", "Unknown");
            return new ItemResponse
            {
                Success = true,
                Message = $"Current state: {state}",
                Data = new { state }
            };
        });
    }

    public ItemResponse ApplyAML(ApplyAmlRequest request)
    {
        var aml = request.Aml?.Trim();
        if (!string.IsNullOrEmpty(aml) && !aml.StartsWith("<AML>", StringComparison.OrdinalIgnoreCase))
        {
            aml = $"<AML>{aml}</AML>";
        }
        return ExecuteIom(inn => inn.applyAML(aml), "AML executed successfully");
    }

    public ItemResponse ApplySQL(ApplySqlRequest request)
    {
        return ExecuteIom(inn => inn.applySQL(request.Sql), "SQL executed successfully");
    }

    public AssertionResponse AssertItemExists(AssertExistsRequest request)
    {
        return ExecuteAssertion(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            foreach (var kvp in request.Criteria)
                item.setProperty(kvp.Key, kvp.Value);
            
            var result = item.apply();
            var count = result.isError() ? 0 : result.getItemCount();
            var passed = count > 0;
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? $"Found {count} matching item(s)" : "No matching items found",
                ActualValue = count.ToString(), ExpectedValue = ">0"
            };
        });
    }

    public AssertionResponse AssertItemNotExists(AssertExistsRequest request)
    {
        return ExecuteAssertion(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            foreach (var kvp in request.Criteria)
                item.setProperty(kvp.Key, kvp.Value);
            
            var result = item.apply();
            var count = result.isError() ? 0 : result.getItemCount();
            var passed = count == 0;
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "No matching items found (as expected)" : $"Found {count} matching item(s) - expected none",
                ActualValue = count.ToString(), ExpectedValue = "0"
            };
        });
    }

    public AssertionResponse AssertPropertyValue(AssertPropertyRequest request)
    {
        return ExecuteAssertion(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };
            
            var actual = item.getProperty(request.Property, "");
            var passed = actual == request.Expected;
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "Property value matches" : $"Expected '{request.Expected}' but got '{actual}'",
                ActualValue = actual, ExpectedValue = request.Expected
            };
        });
    }

    public AssertionResponse AssertState(AssertStateRequest request)
    {
        return ExecuteAssertion(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };
            
            var actual = item.getProperty("state", "");
            var passed = actual == request.ExpectedState;
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "State matches" : $"Expected state '{request.ExpectedState}' but got '{actual}'",
                ActualValue = actual, ExpectedValue = request.ExpectedState
            };
        });
    }
}
