using System.Collections.Concurrent;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Services;

public class ConnectionStore : IConnectionStore
{
    // Key is session name (e.g., "default", "admin-session")
    private readonly ConcurrentDictionary<string, SessionContext> _sessions = new();
    private readonly TimeSpan _sessionTimeout;
    private readonly TimeSpan _logoutTimeout;
    private readonly ILogger<ConnectionStore> _logger;

    public ConnectionStore(IOptions<SessionStoreOptions> sessionStoreOptions, ILogger<ConnectionStore> logger)
    {
        var options = sessionStoreOptions.Value;
        _logger = logger;
        _sessionTimeout = TimeSpan.FromHours(Math.Max(1, options.SessionTimeoutHours));
        _logoutTimeout = TimeSpan.FromSeconds(Math.Max(1, options.LogoutTimeoutSeconds));
    }

    public void AddSession(string name, SessionContext session)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Session name is required.", nameof(name));
        }

        _sessions.AddOrUpdate(
            name,
            session,
            (_, existingSession) =>
            {
                QueueLogout(existingSession, name, "session replacement");
                return session;
            });
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

        if (_sessions.TryGetValue(name, out var session))
        {
            // Check if session is expired
            if (IsExpired(session))
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
            QueueLogout(session, name, "session removal");
        }
    }

    public List<SessionInfo> GetAllSessions()
    {
        return _sessions.Select(kvp => new SessionInfo
        {
            Name = kvp.Key,
            ServerInfo = kvp.Value.ServerInfo,
            IsCurrent = false // Caller needs to determine current
        }).ToList();
    }

    public int CleanupExpiredSessions()
    {
        var expiredSessions = _sessions
            .Where(kvp => IsExpired(kvp.Value))
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var sessionId in expiredSessions)
        {
            RemoveSession(sessionId);
        }

        return expiredSessions.Count;
    }

    private bool IsExpired(SessionContext session)
    {
        return DateTime.UtcNow - session.LastAccessedAt > _sessionTimeout;
    }

    private void QueueLogout(SessionContext session, string sessionName, string reason)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                var logoutTask = Task.Run(() => session.Connection.Logout());
                await logoutTask.WaitAsync(_logoutTimeout);
            }
            catch (TimeoutException ex)
            {
                _logger.LogWarning(ex, "Timed out while logging out session '{SessionName}' during {Reason}", sessionName, reason);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log out session '{SessionName}' during {Reason}", sessionName, reason);
            }
        });
    }
}
