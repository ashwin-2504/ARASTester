using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Aras.IOM;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Options;
using ArasBackend.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Gateways;

public abstract class BaseGateway
{
    protected readonly ArasSessionManager _sessionManager;
    private readonly GatewayResponseOptions _gatewayResponseOptions;

    protected BaseGateway(ArasSessionManager sessionManager, IOptions<GatewayResponseOptions> gatewayResponseOptions)
    {
        _sessionManager = sessionManager;
        _gatewayResponseOptions = gatewayResponseOptions.Value;
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
                Data = BuildResponseData(result),
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
        if (cancellationToken.IsCancellationRequested)
        {
            return Task.FromCanceled<T>(cancellationToken);
        }

        try
        {
            return Task.FromResult(action());
        }
        catch (Exception ex)
        {
            return Task.FromException<T>(ex);
        }
    }

    private object BuildResponseData(Item result)
    {
        var data = new Dictionary<string, object?>
        {
            ["itemType"] = SafeRead(() => result.getType()),
            ["id"] = SafeRead(() => result.getID()),
            ["keyedName"] = SafeRead(() => result.getProperty("keyed_name", "")),
            ["itemCount"] = result.getItemCount()
        };

        if (_gatewayResponseOptions.IncludeRawXmlData)
        {
            data["rawXml"] = result.dom?.OuterXml;
        }

        return data;
    }

    private static string SafeRead(Func<string> read)
    {
        try
        {
            return read();
        }
        catch
        {
            return string.Empty;
        }
    }
}
