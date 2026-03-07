using System;
using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Services;

namespace ArasBackend.Infrastructure.Gateways;

public class UtilityGateway : BaseGateway, IUtilityGateway
{
    public UtilityGateway(ArasSessionManager sessionManager) : base(sessionManager)
    {
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
