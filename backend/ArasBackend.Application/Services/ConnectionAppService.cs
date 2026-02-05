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

    public Task<ConnectionResponse> Connect(ConnectionRequest request, CancellationToken cancellationToken = default) => _sessionManager.Connect(request, cancellationToken);
    public Task<ConnectionResponse> Disconnect(CancellationToken cancellationToken = default) => _sessionManager.Disconnect(cancellationToken);
    public Task<ConnectionResponse> DisconnectSession(string sessionName, CancellationToken cancellationToken = default) => _sessionManager.DisconnectSession(sessionName, cancellationToken);
    public Task<AllSessionsResponse> GetAllSessions(CancellationToken cancellationToken = default) => _sessionManager.GetAllSessions(cancellationToken);
    public Task<ConnectionStatusResponse> GetStatus(CancellationToken cancellationToken = default) => _sessionManager.GetStatus(cancellationToken);
    public Task<ConnectionResponse> ValidateConnection(CancellationToken cancellationToken = default) => _sessionManager.ValidateConnection(cancellationToken);
}
