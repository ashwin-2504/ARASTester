using Aras.IOM;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Core.Exceptions;
using System.IO;

namespace ArasBackend.Infrastructure.Gateways;

using ArasBackend.Infrastructure.Services;

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

    private Task<T> RunAsync<T>(Func<T> action, CancellationToken cancellationToken)
    {
        // Offload to thread pool.
        // Note: Aras IOM is not cancellable once started, but we can prevent starting if token is already cancelled.
        // Task.Run(..., cancellationToken) checks the token before scheduling.
        return Task.Run(action, cancellationToken);
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

    public Task<ItemResponse> ApplyAML(ApplyAmlRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            var aml = request.Aml?.Trim();
            if (!string.IsNullOrEmpty(aml) && !aml.StartsWith("<AML>", StringComparison.OrdinalIgnoreCase))
            {
                aml = $"<AML>{aml}</AML>";
            }
            return ExecuteIom(inn => inn.applyAML(aml), "AML executed successfully");
        }, cancellationToken);
    }

    public Task<ItemResponse> ApplySQL(ApplySqlRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn => inn.applySQL(request.Sql), "SQL executed successfully"), cancellationToken);
    }

    public Task<ItemResponse> ApplyMethod(ApplyMethodRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn => inn.applyMethod(request.MethodName, request.Body ?? ""), "Method executed successfully"), cancellationToken);
    }

    public Task<AssertionResponse> AssertItemExists(AssertExistsRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
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
        }), cancellationToken);
    }

    public Task<AssertionResponse> AssertItemNotExists(AssertExistsRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
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
        }), cancellationToken);
    }

    public Task<AssertionResponse> AssertPropertyValue(AssertPropertyRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
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
        }), cancellationToken);
    }

    public Task<AssertionResponse> AssertState(AssertStateRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
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
        }), cancellationToken);
    }

    public Task<ItemResponse> StartWorkflow(StartWorkflowRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            if (!string.IsNullOrEmpty(request.WorkflowMap))
            {
                return inn.newError("Specifying WorkflowMap is not yet supported. Please omit it to start the default workflow.");
            }

            var item = inn.newItem(request.ItemType, "startWorkflow");
            item.setID(request.Id);
            return item.apply();
        }, "Workflow started"), cancellationToken);
    }

    public Task<ItemResponse> GetAssignedActivities(CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            // Get current user's ID for filtering activities
            var userId = inn.getUserID();
            var q = inn.newItem("Activity Assignment", "get");
            q.setProperty("related_id", userId);
            q.setProperty("is_current", "1");
            return q.apply();
        }, "Assigned activities retrieved"), cancellationToken);
    }

    public Task<ItemResponse> CompleteActivity(CompleteActivityRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var userId = inn.getUserID();
            var findAssign = inn.newItem("Activity Assignment", "get");
            findAssign.setProperty("source_id", request.ActivityId);
            findAssign.setProperty("related_id", userId);
            findAssign.setProperty("is_current", "1");
            var assignResult = findAssign.apply();

            if (assignResult.isError())
                return inn.newError($"No active assignment found for activity {request.ActivityId}");

            var assignmentId = assignResult.getID();

            var complete = inn.newItem("Activity Assignment", "EvaluateActivity");
            complete.setID(assignmentId);
            complete.setProperty("path", request.Path);
            if (!string.IsNullOrEmpty(request.Comments))
                complete.setProperty("comments", request.Comments);
            complete.setProperty("complete", "1");

            return complete.apply();
        }, "Activity completed"), cancellationToken);
    }

    public Task<AssertionResponse> AssertPropertyContains(AssertPropertyContainsRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };

            var actual = item.getProperty(request.Property, "");
            var passed = actual.Contains(request.Contains);
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "Property contains expected text" : $"Expected to contain '{request.Contains}' but got '{actual}'",
                ActualValue = actual, ExpectedValue = $"Contains '{request.Contains}'"
            };
        }), cancellationToken);
    }

    public Task<AssertionResponse> AssertCount(AssertCountRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            foreach (var kvp in request.Criteria)
                item.setProperty(kvp.Key, kvp.Value);

            var result = item.apply();
            var count = result.isError() ? 0 : result.getItemCount();
            var passed = count == request.ExpectedCount;
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "Count matches" : $"Expected {request.ExpectedCount} items, found {count}",
                ActualValue = count.ToString(), ExpectedValue = request.ExpectedCount.ToString()
            };
        }), cancellationToken);
    }

    public Task<AssertionResponse> AssertLocked(LockRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };

            var lockedBy = item.getProperty("locked_by_id");
            var passed = !string.IsNullOrEmpty(lockedBy);
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "Item is locked" : "Item is not locked",
                ActualValue = passed ? "Locked" : "Unlocked", ExpectedValue = "Locked"
            };
        }), cancellationToken);
    }

    public Task<AssertionResponse> AssertUnlocked(LockRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };

            var lockedBy = item.getProperty("locked_by_id");
            var passed = string.IsNullOrEmpty(lockedBy);
            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "Item is unlocked" : $"Item is locked by {lockedBy}",
                ActualValue = passed ? "Unlocked" : "Locked", ExpectedValue = "Unlocked"
            };
        }), cancellationToken);
    }

    public Task<ItemResponse> UploadFile(UploadFileRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "edit");
            item.setID(request.Id);
            item.setFileProperty(request.PropertyName, request.FilePath);
            return item.apply();
        }, "File uploaded"), cancellationToken);
    }

    public Task<ItemResponse> DownloadFile(DownloadFileRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return item;

            var fileId = item.getProperty(request.PropertyName);
            if (string.IsNullOrEmpty(fileId))
                return inn.newError("File property is empty");

            var fileItem = inn.getItemById("File", fileId);
            if (fileItem.isError()) return fileItem;

            var dir = Path.GetDirectoryName(request.SavePath);
            if (string.IsNullOrEmpty(dir)) dir = request.SavePath; // Fallback if no dir component

            return fileItem.checkout(dir);
        }, "File downloaded"), cancellationToken);
    }

    public Task<AssertionResponse> VerifyFileExists(VerifyFileExistsRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteAssertion(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return new AssertionResponse { Success = false, Passed = false, Message = item.getErrorString() };

            var fileId = item.getProperty(request.PropertyName);
            var passed = !string.IsNullOrEmpty(fileId);

            return new AssertionResponse
            {
                Success = true, Passed = passed,
                Message = passed ? "File property is set" : "File property is empty",
                ActualValue = fileId, ExpectedValue = "Valid File ID"
            };
        }), cancellationToken);
    }

    public Task<ItemResponse> GenerateID(CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
             var id = inn.getNewID();
             var res = inn.newItem("Result");
             res.setProperty("id", id);
             return res;
        }, "ID Generated"), cancellationToken);
    }

    public Task<ItemResponse> GetNextSequence(GetNextSequenceRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var seq = inn.getNextSequence(request.SequenceName);
            var res = inn.newItem("Result");
            res.setProperty("sequence", seq);
            return res;
        }, "Sequence retrieved"), cancellationToken);
    }

    public async Task<ItemResponse> Wait(WaitRequest request, CancellationToken cancellationToken = default)
    {
        await Task.Delay(request.Duration, cancellationToken);
        return new ItemResponse { Success = true, Message = $"Waited {request.Duration}ms" };
    }

    public Task<ItemResponse> SetVariable(SetVariableRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            _sessionManager.SetSessionVariable(request.VariableName, request.Value);
            return new ItemResponse { Success = true, Message = $"Variable '{request.VariableName}' set" };
        }, cancellationToken);
    }

    public Task<ItemResponse> LogMessage(LogMessageRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() =>
        {
            _sessionManager.AddSessionLog(request.Message);
            return new ItemResponse { Success = true, Message = "Message logged" };
        }, cancellationToken);
    }
}
