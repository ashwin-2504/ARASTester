using System.Collections.Concurrent;
using ArasBackend.Core.Models;

namespace ArasBackend.Infrastructure.Services;

public class ConnectionStore : IConnectionStore
{
    // Key is session name (e.g., "default", "admin-session")
    private readonly ConcurrentDictionary<string, SessionContext> _sessions = new();
    private readonly TimeSpan _sessionTimeout = TimeSpan.FromHours(4);
    private DateTime _lastCleanup = DateTime.UtcNow;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(30);

    public void AddSession(string name, SessionContext session)
    {
        CleanupExpiredSessions();
        _sessions[name] = session;
    }

    [Obsolete]
    public string AddSession(SessionContext session)
    {
        // Legacy support - auto-generate name if not provided
        var id = Guid.NewGuid().ToString();
        AddSession(id, session);
        return id;
    }

    public SessionContext? GetSession(string name)
    {
        if (string.IsNullOrEmpty(name)) return null;
        
        CleanupExpiredSessions();
        
        if (_sessions.TryGetValue(name, out var session))
        {
            // Check if session is expired
            if (DateTime.UtcNow - session.LastAccessedAt > _sessionTimeout)
            {
                RemoveSession(name);
                return null;
            }
            // Update last accessed time
            session.LastAccessedAt = DateTime.UtcNow;
            return session;
        }
        return null;
    }

    public void RemoveSession(string name)
    {
        if (string.IsNullOrEmpty(name)) return;
        if (_sessions.TryRemove(name, out var session))
        {
            try { session.Connection.Logout(); } catch { }
        }
    }

    public List<SessionInfo> GetAllSessions()
    {
        CleanupExpiredSessions();
        return _sessions.Select(kvp => new SessionInfo
        {
            Name = kvp.Key,
            ServerInfo = kvp.Value.ServerInfo,
            IsCurrent = false // Caller needs to determine current
        }).ToList();
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
