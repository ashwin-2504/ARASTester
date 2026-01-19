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
        return Ok(response);
    }

    [HttpPost("disconnect")]
    public ActionResult<ConnectionResponse> Disconnect()
    {
        var response = _connectionService.Disconnect();
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
