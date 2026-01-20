using System.Collections.Concurrent;

namespace ArasBackend.Infrastructure.Services;

public class ConnectionStore : IConnectionStore
{
    private readonly ConcurrentDictionary<string, SessionContext> _sessions = new();
    private readonly TimeSpan _sessionTimeout = TimeSpan.FromHours(4);
    private DateTime _lastCleanup = DateTime.UtcNow;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(30);

    public string AddSession(SessionContext session)
    {
        CleanupExpiredSessions();
        var sessionId = Guid.NewGuid().ToString();
        _sessions[sessionId] = session;
        return sessionId;
    }

    public SessionContext? GetSession(string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return null;
        
        CleanupExpiredSessions();
        
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            // Check if session is expired
            if (DateTime.UtcNow - session.LastAccessedAt > _sessionTimeout)
            {
                RemoveSession(sessionId);
                return null;
            }
            // Update last accessed time
            session.LastAccessedAt = DateTime.UtcNow;
            return session;
        }
        return null;
    }

    public void RemoveSession(string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId)) return;
        if (_sessions.TryRemove(sessionId, out var session))
        {
            try { session.Connection.Logout(); } catch { }
        }
    }

    private void CleanupExpiredSessions()
    {
        if (DateTime.UtcNow - _lastCleanup < _cleanupInterval) return;
        
        _lastCleanup = DateTime.UtcNow;
        var expiredSessions = _sessions
            .Where(kvp => DateTime.UtcNow - kvp.Value.LastAccessedAt > _sessionTimeout)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var sessionId in expiredSessions)
        {
            RemoveSession(sessionId);
        }
    }
}
