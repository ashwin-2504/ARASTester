using Aras.IOM;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Exceptions;
using ArasBackend.Core.Models;
using ArasBackend.Application.Interfaces;

namespace ArasBackend.Infrastructure.Services;

public class ArasSessionManager : IArasSessionManager
{
    private readonly IConnectionStore _connectionStore;
    private readonly ISessionContext _sessionContext;

    public ArasSessionManager(IConnectionStore connectionStore, ISessionContext sessionContext)
    {
        _connectionStore = connectionStore;
        _sessionContext = sessionContext;
    }

    private string? GetSessionId()
    {
        return _sessionContext.SessionId;
    }

    private SessionContext? GetCurrentSession()
    {
        var sessionId = GetSessionId();
        if (string.IsNullOrEmpty(sessionId)) return null;
        return _connectionStore.GetSession(sessionId);
    }

    public bool IsConnected
    {
        get
        {
            var session = GetCurrentSession();
            return session != null;
        }
    }

    public ServerInfo? CurrentServerInfo => GetCurrentSession()?.ServerInfo;

    public ConnectionResponse Connect(ConnectionRequest request)
    {
        try
        {
            // If request defines a specific session name, we use that. 
            // Otherwise default key.
            var sessionName = !string.IsNullOrEmpty(request.SessionName) 
                ? request.SessionName 
                : (GetSessionId() ?? "default");

            // Create Connection
            var connection = IomFactory.CreateHttpServerConnection(
                request.Url,
                request.Database,
                request.Username,
                request.Password
            );

            var loginResult = connection.Login();
            
            if (loginResult.isError())
            {
                throw new ArasAuthException(loginResult.getErrorString());
            }

            var innovator = loginResult.getInnovator();
            
            var session = new SessionContext
            {
                Connection = connection,
                Innovator = innovator,
                ServerInfo = new ServerInfo
                {
                    Database = request.Database,
                    UserId = innovator.getUserID(),
                    UserName = request.Username,
                    Url = request.Url
                }
            };

            // Store Session
            _connectionStore.AddSession(sessionName, session);

            // NOTE: We do NOT set cookies here anymore. That is a Presentation Layer concern.
            // We return the SessionName so the Controller can deal with it.

            return new ConnectionResponse
            {
                Success = true,
                Message = "Successfully connected",
                ServerInfo = session.ServerInfo,
                SessionName = sessionName
            };
        }
        catch (ArasException) { throw; }
        catch (Exception ex)
        {
            throw new ArasInfrastructureException($"Connection failed: {ex.Message}");
        }
    }

    public ConnectionResponse Disconnect()
    {
        // Disconnects current session context
        var sessionId = GetSessionId();
        if (string.IsNullOrEmpty(sessionId)) return new ConnectionResponse { Success = true, Message = "Already disconnected" };

        return DisconnectSession(sessionId);
    }

    public ConnectionResponse DisconnectSession(string sessionName)
    {
        _connectionStore.RemoveSession(sessionName);
        
        // NOTE: We do NOT clear cookies here. That is a Presentation Layer concern.
        
        return new ConnectionResponse { Success = true, Message = $"Session '{sessionName}' disconnected" };
    }

    public AllSessionsResponse GetAllSessions()
    {
        var allSessions = _connectionStore.GetAllSessions();
        var currentSessionName = GetSessionId() ?? "";

        // Mark the current one
        foreach (var s in allSessions)
        {
            if (s.Name == currentSessionName) s.IsCurrent = true;
        }

        return new AllSessionsResponse
        {
             Sessions = allSessions,
             CurrentSession = currentSessionName
        };
    }

    public ConnectionStatusResponse GetStatus()
    {
        var session = GetCurrentSession();
        return new ConnectionStatusResponse
        {
            IsConnected = session != null,
            Status = session != null ? "Connected" : "Disconnected",
            ServerInfo = session?.ServerInfo
        };
    }

    public ConnectionResponse ValidateConnection()
    {
        var session = GetCurrentSession();
        if (session == null) throw new ArasAuthException("Not connected");

        return Execute(inn =>
        {
            var userId = inn.getUserID();
            var userItem = inn.getItemById("User", userId);
            
            if (userItem.isError())
                throw new ArasAuthException($"Validation failed: {userItem.getErrorString()}");
            
            var userName = userItem.getProperty("keyed_name", "Unknown"); // Or login_name
            return new ConnectionResponse
            {
                Success = true,
                Message = $"Valid. User: {userName}",
                ServerInfo = session.ServerInfo,
                SessionName = GetSessionId()
            };
        });
    }

    internal T Execute<T>(Func<Innovator, T> action)
    {
        var session = GetCurrentSession();
        if (session == null)
            throw new ArasAuthException("Session is not active.");

        lock (session.Lock)
        {
            try
            {
                return action(session.Innovator);
            }
            catch (Exception ex)
            {
                if (ex is ArasException) throw;
                throw new ArasInfrastructureException($"IOM Error: {ex.Message}");
            }
        }
    }

    internal void SetSessionVariable(string name, object? value)
    {
        var session = GetCurrentSession();
        if (session == null) throw new ArasAuthException("Session is not active.");
        lock (session.Lock)
        {
            if (value == null) session.Variables.Remove(name);
            else session.Variables[name] = value;
        }
    }

    internal void AddSessionLog(string message)
    {
        var session = GetCurrentSession();
        if (session != null)
        {
            lock (session.Lock)
            {
                session.TestLogs.Add($"[{DateTime.UtcNow:O}] {message}");
            }
        }
    }
}
