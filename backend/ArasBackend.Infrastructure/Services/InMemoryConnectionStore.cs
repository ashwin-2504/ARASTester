using System.Collections.Concurrent;

namespace ArasBackend.Infrastructure.Services;

public class ConnectionStore : IConnectionStore
{
    private readonly ConcurrentDictionary<string, SessionContext> _sessions = new();

    public string AddSession(SessionContext session)
    {
        var sessionId = Guid.NewGuid().ToString();
        _sessions[sessionId] = session;
        return sessionId;
    }

    public SessionContext? GetSession(string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return null;
        _sessions.TryGetValue(sessionId, out var session);
        return session;
    }

    public void RemoveSession(string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return;
        _sessions.TryRemove(sessionId, out _);
    }
}
