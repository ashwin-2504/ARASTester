using Microsoft.AspNetCore.Mvc;
using global::ArasBackend.Application.Services;
using global::ArasBackend.Core.Models;
using ArasBackend.Options;
using Microsoft.Extensions.Options;

namespace ArasBackend.Controllers;

[ApiController]
[Route("api/aras")]
public class ConnectionController : ControllerBase
{
    private readonly ConnectionAppService _connectionService;
    private readonly IWebHostEnvironment _env;
    private readonly SessionResolutionOptions _sessionOptions;

    public ConnectionController(
        ConnectionAppService connectionService,
        IWebHostEnvironment env,
        IOptions<SessionResolutionOptions> sessionOptions)
    {
        _connectionService = connectionService;
        _env = env;
        _sessionOptions = sessionOptions.Value;
    }

    [HttpPost("connect")]
    public async Task<ActionResult<ConnectionResponse>> Connect(ConnectionRequest request)
    {
        var response = await _connectionService.Connect(request, HttpContext.RequestAborted);
        
        // Side-Effect: Set Cookie in the Presentation Layer
        if (response.Success && !string.IsNullOrEmpty(response.SessionName))
        {
            var isSecure = _env.IsProduction();
            
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = isSecure, 
                SameSite = SameSiteMode.Lax
            };
            
            Response.Cookies.Append(_sessionOptions.SessionCookieName, response.SessionName, cookieOptions);
        }

        return Ok(response);
    }

    [HttpPost("disconnect")]
    public async Task<ActionResult<ConnectionResponse>> Disconnect()
    {
        var response = await _connectionService.Disconnect(HttpContext.RequestAborted);
        
        // Side-Effect: Clear Cookie
        Response.Cookies.Delete(_sessionOptions.SessionCookieName);
        
        return Ok(response);
    }

    [HttpPost("disconnect/{sessionName}")]
    public async Task<ActionResult<ConnectionResponse>> DisconnectSession(string sessionName)
    {
        var response = await _connectionService.DisconnectSession(sessionName, HttpContext.RequestAborted);
        
        // If the session being disconnected matches the current cookie, clear the cookie
        var currentCookie = Request.Cookies[_sessionOptions.SessionCookieName];
        if (!string.IsNullOrEmpty(currentCookie) && currentCookie == sessionName)
        {
             Response.Cookies.Delete(_sessionOptions.SessionCookieName);
        }
        
        return Ok(response);
    }

    [HttpGet("sessions")]
    public async Task<ActionResult<AllSessionsResponse>> GetAllSessions()
    {
        var response = await _connectionService.GetAllSessions(HttpContext.RequestAborted);
        return Ok(response);
    }

    [HttpGet("connection-status")]
    public async Task<ActionResult<ConnectionStatusResponse>> GetStatus()
    {
        var response = await _connectionService.GetStatus(HttpContext.RequestAborted);
        return Ok(response);
    }

    [HttpGet("validate")]
    public async Task<ActionResult<ConnectionResponse>> Validate()
    {
        var response = await _connectionService.ValidateConnection(HttpContext.RequestAborted);
        return Ok(response);
    }
}
