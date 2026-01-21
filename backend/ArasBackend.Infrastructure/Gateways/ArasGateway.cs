using Aras.IOM;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Core.Exceptions;
using System.IO;

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
        return ExecuteIom(inn => 
        {
            var item = inn.newItem(request.ItemType, "get");
            item.setID(request.Id);
            if (!string.IsNullOrEmpty(request.Select)) 
            {
                item.setAttribute("select", request.Select);
            }
            return item.apply();
        }, "Item retrieved");
    }

    public ItemResponse GetItemByKeyedName(GetByKeyedNameRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "get");
            item.setProperty("keyed_name", request.KeyedName);
            if (!string.IsNullOrEmpty(request.Select))
            {
                item.setAttribute("select", request.Select);
            }
            return item.apply();
        }, "Item retrieved");
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
            var item = inn.newItem(request.ItemType, "lock");
            item.setID(request.Id);
            return item.apply();
        }, "Item locked successfully");
    }

    public ItemResponse UnlockItem(LockRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "unlock");
            item.setID(request.Id);
            return item.apply();
        }, "Item unlocked successfully");
    }

    public ItemResponse CheckLockStatus(LockRequest request)
    {
        // Custom logic for CheckLockStatus as it returns specific Data structure
        return _sessionManager.Execute(inn =>
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
        });
    }

    public ItemResponse AddRelationship(AddRelationshipRequest request)
    {
        return ExecuteIom(inn =>
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
        }, "Relationship created successfully");
    }

    public ItemResponse GetRelationships(GetRelationshipsRequest request)
    {
        return ExecuteIom(inn =>
        {
            var rel = inn.newItem(request.RelationshipType, "get");
            rel.setProperty("source_id", request.Id);
            if (!string.IsNullOrEmpty(request.Select))
                rel.setAttribute("select", request.Select);
            
            return rel.apply();
        }, "Relationships retrieved");
    }

    public ItemResponse DeleteRelationship(DeleteRelationshipRequest request)
    {
        return ExecuteIom(inn =>
        {
            var rel = inn.newItem(request.RelationshipType, "delete");
            rel.setID(request.RelationshipId);
            return rel.apply();
        }, "Relationship deleted successfully");
    }

    public ItemResponse PromoteItem(PromoteRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "promoteItem");
            item.setID(request.Id);
            item.setProperty("state", request.TargetState);
            if (!string.IsNullOrEmpty(request.Comments))
                item.setProperty("comments", request.Comments);
            return item.apply();
        }, $"Item promoted to {request.TargetState}");
    }

    public ItemResponse GetCurrentState(GetByIdRequest request)
    {
         return _sessionManager.Execute(inn =>
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

    public ItemResponse ApplyMethod(ApplyMethodRequest request)
    {
        return ExecuteIom(inn => inn.applyMethod(request.MethodName, request.Body ?? ""), "Method executed successfully");
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

    public ItemResponse StartWorkflow(StartWorkflowRequest request)
    {
        return ExecuteIom(inn =>
        {
            if (!string.IsNullOrEmpty(request.WorkflowMap))
            {
                return inn.newError("Specifying WorkflowMap is not yet supported. Please omit it to start the default workflow.");
            }

            var item = inn.newItem(request.ItemType, "startWorkflow");
            item.setID(request.Id);
            return item.apply();
        }, "Workflow started");
    }

    public ItemResponse GetAssignedActivities()
    {
        return ExecuteIom(inn =>
        {
            var identityList = inn.getIdentityList();
            var q = inn.newItem("Activity Assignment", "get");
            q.setProperty("related_id", identityList);
            q.setPropertyCondition("related_id", "in");
            q.setProperty("is_current", "1");
            return q.apply();
        }, "Assigned activities retrieved");
    }

    public ItemResponse CompleteActivity(CompleteActivityRequest request)
    {
        return ExecuteIom(inn =>
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
        }, "Activity completed");
    }

    public AssertionResponse AssertPropertyContains(AssertPropertyContainsRequest request)
    {
        return ExecuteAssertion(inn =>
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
        });
    }

    public AssertionResponse AssertCount(AssertCountRequest request)
    {
        return ExecuteAssertion(inn =>
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
        });
    }

    public AssertionResponse AssertLocked(LockRequest request)
    {
        return ExecuteAssertion(inn =>
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
        });
    }

    public AssertionResponse AssertUnlocked(LockRequest request)
    {
        return ExecuteAssertion(inn =>
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
        });
    }

    public ItemResponse UploadFile(UploadFileRequest request)
    {
        return ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "edit");
            item.setID(request.Id);
            item.setFileProperty(request.PropertyName, request.FilePath);
            return item.apply();
        }, "File uploaded");
    }

    public ItemResponse DownloadFile(DownloadFileRequest request)
    {
        return ExecuteIom(inn =>
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
        }, "File downloaded");
    }

    public AssertionResponse VerifyFileExists(VerifyFileExistsRequest request)
    {
        return ExecuteAssertion(inn =>
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
        });
    }

    public ItemResponse GenerateID()
    {
        return ExecuteIom(inn =>
        {
             var id = inn.getNewID();
             var res = inn.newItem("Result");
             res.setProperty("id", id);
             return res;
        }, "ID Generated");
    }

    public ItemResponse GetNextSequence(GetNextSequenceRequest request)
    {
        return ExecuteIom(inn =>
        {
            var seq = inn.getNextSequence(request.SequenceName);
            var res = inn.newItem("Result");
            res.setProperty("sequence", seq);
            return res;
        }, "Sequence retrieved");
    }

    public ItemResponse Wait(WaitRequest request)
    {
        Thread.Sleep(request.Duration);
        return new ItemResponse { Success = true, Message = $"Waited {request.Duration}ms" };
    }

    public ItemResponse SetVariable(SetVariableRequest request)
    {
        _sessionManager.SetSessionVariable(request.VariableName, request.Value);
        return new ItemResponse { Success = true, Message = $"Variable '{request.VariableName}' set" };
    }

    public ItemResponse LogMessage(LogMessageRequest request)
    {
        _sessionManager.AddSessionLog(request.Message);
        return new ItemResponse { Success = true, Message = "Message logged" };
    }
}
