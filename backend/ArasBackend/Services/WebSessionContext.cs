using ArasBackend.Application.Interfaces;

namespace ArasBackend.Services;

/// <summary>
/// Web-specific implementation of the Session Context.
/// Resolves the Session ID from the current HTTP Request context.
/// 
/// Precedence Rule:
/// 1. "X-Session-Name" HTTP Header (Explicit Override / API Client)
/// 2. "ARAS_SESSION_ID" HTTPOnly Cookie (Browser / Default)
/// </summary>
public class WebSessionContext : ISessionContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string CookieName = "ARAS_SESSION_ID";
    private const string HeaderName = "X-Session-Name";

    public WebSessionContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? SessionId => GetSessionId();

    private string? GetSessionId()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        // 1. Check Header (High Priority - for programmatic clients)
        if (context.Request.Headers.TryGetValue(HeaderName, out var headerValues))
        {
            var headerValue = headerValues.FirstOrDefault();
            if (!string.IsNullOrEmpty(headerValue)) return headerValue;
        }

        // 2. Check Cookie (Fallback - for browser sessions)
        return context.Request.Cookies[CookieName];
    }
}
