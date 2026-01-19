using Aras.IOM;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Exceptions;
using ArasBackend.Core.Models;
using Microsoft.AspNetCore.Http;

namespace ArasBackend.Infrastructure.Services;

public class ArasSessionManager : IArasSessionManager
{
    private readonly IConnectionStore _connectionStore;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string CookieName = "ARAS_SESSION_ID";

    public ArasSessionManager(IConnectionStore connectionStore, IHttpContextAccessor httpContextAccessor)
    {
        _connectionStore = connectionStore;
        _httpContextAccessor = httpContextAccessor;
    }

    private string? GetSessionId()
    {
        return _httpContextAccessor.HttpContext?.Request.Cookies[CookieName];
    }

    private void SetSessionId(string sessionId)
    {
        _httpContextAccessor.HttpContext?.Response.Cookies.Append(CookieName, sessionId, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // Allow HTTP for localhost
            SameSite = SameSiteMode.Lax
        });
    }

    private void ClearSessionId()
    {
        _httpContextAccessor.HttpContext?.Response.Cookies.Delete(CookieName);
    }

    private SessionContext? GetCurrentSession()
    {
        var sessionId = GetSessionId();
        return _connectionStore.GetSession(sessionId!);
    }

    public bool IsConnected
    {
        get
        {
            var session = GetCurrentSession();
            return session != null;
        }
    }

    public ServerInfo? CurrentServerInfo
    {
        get
        {
            var session = GetCurrentSession();
            return session?.ServerInfo;
        }
    }

    public ConnectionResponse Connect(ConnectionRequest request)
    {
        // No lock needed for Connect creation, only for checking existing?
        // Actually, if we are creating a NEW session, we don't need to lock anything.
        
        try
        {
            // Disconnect existing if any
            if (IsConnected) Disconnect();

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

            var sessionId = _connectionStore.AddSession(session);
            SetSessionId(sessionId);

            return new ConnectionResponse
            {
                Success = true,
                Message = "Successfully connected",
                ServerInfo = session.ServerInfo
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
        var sessionId = GetSessionId();
        if (string.IsNullOrEmpty(sessionId)) return new ConnectionResponse { Success = true, Message = "Already disconnected" };

        var session = _connectionStore.GetSession(sessionId);
        if (session != null)
        {
            lock (session.Lock)
            {
                try
                {
                    session.Connection.Logout();
                }
                catch { /* Ignore logout errors */ }
            }
            _connectionStore.RemoveSession(sessionId);
        }
        
        ClearSessionId();
        return new ConnectionResponse { Success = true, Message = "Disconnected" };
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

            var userName = userItem.getProperty("keyed_name", "Unknown");
            return new ConnectionResponse
            {
                Success = true,
                Message = $"Valid. User: {userName}",
                ServerInfo = session.ServerInfo
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
}

