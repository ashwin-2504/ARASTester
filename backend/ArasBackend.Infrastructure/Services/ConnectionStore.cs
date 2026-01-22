using Aras.IOM;
using ArasBackend.Core.Models;

namespace ArasBackend.Infrastructure.Services;

public class SessionContext
{
    public required HttpServerConnection Connection { get; set; }
    public required Innovator Innovator { get; set; }
    public object Lock { get; } = new();
    public required ServerInfo ServerInfo { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Variables { get; } = new();
    public List<string> TestLogs { get; } = new();
}

public interface IConnectionStore
{
    void AddSession(string name, SessionContext session);
    [Obsolete("Use AddSession(string name, SessionContext session) instead")]
    string AddSession(SessionContext session);
    SessionContext? GetSession(string name);
    void RemoveSession(string name);
    List<SessionInfo> GetAllSessions();
}
