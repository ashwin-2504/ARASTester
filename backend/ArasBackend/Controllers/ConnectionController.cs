using Microsoft.AspNetCore.Mvc;
using global::ArasBackend.Application.Services;
using global::ArasBackend.Core.Models;

namespace ArasBackend.Controllers;

[ApiController]
[Route("api/aras")]
public class ConnectionController : ControllerBase
{
    private readonly ConnectionAppService _connectionService;

    public ConnectionController(ConnectionAppService connectionService)
    {
        _connectionService = connectionService;
    }

    [HttpPost("connect")]
    public ActionResult<ConnectionResponse> Connect(ConnectionRequest request)
    {
        var response = _connectionService.Connect(request);
        
        // Side-Effect: Set Cookie in the Presentation Layer
        if (response.Success && !string.IsNullOrEmpty(response.SessionName))
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // Allow HTTP for localhost, set to true in Production
                SameSite = SameSiteMode.Lax
            };
            
            Response.Cookies.Append("ARAS_SESSION_ID", response.SessionName, cookieOptions);
        }

        return Ok(response);
    }

    [HttpPost("disconnect")]
    public ActionResult<ConnectionResponse> Disconnect()
    {
        var response = _connectionService.Disconnect();
        
        // Side-Effect: Clear Cookie
        Response.Cookies.Delete("ARAS_SESSION_ID");
        
        return Ok(response);
    }

    [HttpPost("disconnect/{sessionName}")]
    public ActionResult<ConnectionResponse> DisconnectSession(string sessionName)
    {
        var response = _connectionService.DisconnectSession(sessionName);
        
        // If the session being disconnected matches the current cookie, clear the cookie
        // Note: The Controller can read the cookie to check this
        var currentCookie = Request.Cookies["ARAS_SESSION_ID"];
        if (!string.IsNullOrEmpty(currentCookie) && currentCookie == sessionName)
        {
             Response.Cookies.Delete("ARAS_SESSION_ID");
        }
        
        return Ok(response);
    }

    [HttpGet("sessions")]
    public ActionResult<AllSessionsResponse> GetAllSessions()
    {
        var response = _connectionService.GetAllSessions();
        return Ok(response);
    }

    [HttpGet("connection-status")]
    public ActionResult<ConnectionStatusResponse> GetStatus()
    {
        var response = _connectionService.GetStatus();
        return Ok(response);
    }

    [HttpGet("validate")]
    public ActionResult<ConnectionResponse> Validate()
    {
        var response = _connectionService.ValidateConnection();
        return Ok(response);
    }
}
