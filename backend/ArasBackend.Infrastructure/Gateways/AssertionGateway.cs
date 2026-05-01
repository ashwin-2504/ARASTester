using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Options;
using ArasBackend.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Gateways;

public class AssertionGateway : BaseGateway, IAssertionGateway
{
    public AssertionGateway(ArasSessionManager sessionManager, IOptions<GatewayResponseOptions> gatewayResponseOptions) : base(sessionManager, gatewayResponseOptions)
    {
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
}
