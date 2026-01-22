using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;

namespace ArasBackend.Application.Services;

public class ConnectionAppService
{
    private readonly IArasSessionManager _sessionManager;

    public ConnectionAppService(IArasSessionManager sessionManager)
    {
        _sessionManager = sessionManager;
    }

    public ConnectionResponse Connect(ConnectionRequest request) => _sessionManager.Connect(request);
    public ConnectionResponse Disconnect() => _sessionManager.Disconnect();
    public ConnectionResponse DisconnectSession(string sessionName) => _sessionManager.DisconnectSession(sessionName);
    public AllSessionsResponse GetAllSessions() => _sessionManager.GetAllSessions();
    public ConnectionStatusResponse GetStatus() => _sessionManager.GetStatus();
    public ConnectionResponse ValidateConnection() => _sessionManager.ValidateConnection();
}
