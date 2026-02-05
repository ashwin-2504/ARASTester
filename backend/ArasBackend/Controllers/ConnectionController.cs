using Microsoft.AspNetCore.Mvc;
using global::ArasBackend.Application.Services;
using global::ArasBackend.Core.Models;

namespace ArasBackend.Controllers;

[ApiController]
[Route("api/aras")]
public class ConnectionController : ControllerBase
{
    private readonly ConnectionAppService _connectionService;
    private readonly IWebHostEnvironment _env;

    public ConnectionController(ConnectionAppService connectionService, IWebHostEnvironment env)
    {
        _connectionService = connectionService;
        _env = env;
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
            
            Response.Cookies.Append("ARAS_SESSION_ID", response.SessionName, cookieOptions);
        }

        return Ok(response);
    }

    [HttpPost("disconnect")]
    public async Task<ActionResult<ConnectionResponse>> Disconnect()
    {
        var response = await _connectionService.Disconnect(HttpContext.RequestAborted);
        
        // Side-Effect: Clear Cookie
        Response.Cookies.Delete("ARAS_SESSION_ID");
        
        return Ok(response);
    }

    [HttpPost("disconnect/{sessionName}")]
    public async Task<ActionResult<ConnectionResponse>> DisconnectSession(string sessionName)
    {
        var response = await _connectionService.DisconnectSession(sessionName, HttpContext.RequestAborted);
        
        // If the session being disconnected matches the current cookie, clear the cookie
        var currentCookie = Request.Cookies["ARAS_SESSION_ID"];
        if (!string.IsNullOrEmpty(currentCookie) && currentCookie == sessionName)
        {
             Response.Cookies.Delete("ARAS_SESSION_ID");
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
