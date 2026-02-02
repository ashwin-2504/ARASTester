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
    private readonly string _cookieName;
    private readonly string _headerName;

    public WebSessionContext(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _cookieName = configuration["Aras:SessionCookieName"] ?? "ARAS_SESSION_ID";
        _headerName = configuration["Aras:SessionHeaderName"] ?? "X-Session-Name";
    }

    public string? SessionId => GetSessionId();

    private string? GetSessionId()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        // 1. Check Header (High Priority - for programmatic clients)
        if (context.Request.Headers.TryGetValue(_headerName, out var headerValues))
        {
            var headerValue = headerValues.FirstOrDefault();
            if (!string.IsNullOrEmpty(headerValue)) return headerValue;
        }

        // 2. Check Cookie (Fallback - for browser sessions)
        return context.Request.Cookies[_cookieName];
    }
}
