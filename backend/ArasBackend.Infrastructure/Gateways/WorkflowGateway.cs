using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Options;
using ArasBackend.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Gateways;

public class WorkflowGateway : BaseGateway, IWorkflowGateway
{
    public WorkflowGateway(ArasSessionManager sessionManager, IOptions<GatewayResponseOptions> gatewayResponseOptions) : base(sessionManager, gatewayResponseOptions)
    {
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
}
