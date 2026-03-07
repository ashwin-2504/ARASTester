using System;
using System.Threading;
using System.Threading.Tasks;
using Aras.IOM;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Services;

namespace ArasBackend.Infrastructure.Gateways;

public abstract class BaseGateway
{
    protected readonly ArasSessionManager _sessionManager;

    protected BaseGateway(ArasSessionManager sessionManager)
    {
        _sessionManager = sessionManager;
    }

    protected ItemResponse ExecuteIom(Func<Innovator, Item> action, string successMessage = "Success")
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

    protected AssertionResponse ExecuteAssertion(Func<Innovator, AssertionResponse> action)
    {
        return _sessionManager.Execute(action);
    }

    protected Task<T> RunAsync<T>(Func<T> action, CancellationToken cancellationToken)
    {
        // Offload to thread pool.
        // Note: Aras IOM is not cancellable once started, but we can prevent starting if token is already cancelled.
        // Task.Run(..., cancellationToken) checks the token before scheduling.
        return Task.Run(action, cancellationToken);
    }
}
