using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ArasBackend.Application.Interfaces;

namespace ArasBackend.Middleware;

/// <summary>
/// Custom Authorization Filter to enforce Aras Session presence.
/// Checks if a valid SessionId is resolvable from the context.
/// Does NOT validate session expiry/claims - that is the responsibility of the Service layer.
/// Usage: [ArasAuthorize] on Controllers or Actions.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ArasAuthorizeAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // Skip authorization if AllowAnonymous is present
        if (context.ActionDescriptor.EndpointMetadata.Any(em => em is Microsoft.AspNetCore.Authorization.AllowAnonymousAttribute))
        {
            return;
        }

        var sessionContext = context.HttpContext.RequestServices.GetService<ISessionContext>();
        
        if (sessionContext == null)
        {
            // Should not happen if DI is configured correctly
            context.Result = new StatusCodeResult(StatusCodes.Status500InternalServerError);
            return;
        }

        if (string.IsNullOrEmpty(sessionContext.SessionId))
        {
            context.Result = new JsonResult(new { Success = false, Message = "Unauthorized: Active session required." })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        await Task.CompletedTask;
    }
}
