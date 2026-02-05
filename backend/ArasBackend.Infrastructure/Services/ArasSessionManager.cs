using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<ArasSessionManager> _logger;
    private const int DefaultTimeoutSeconds = 45;

    public ArasSessionManager(
        IConnectionStore connectionStore, 
        ISessionContext sessionContext,
        ILogger<ArasSessionManager> logger)
    {
        _connectionStore = connectionStore;
        _sessionContext = sessionContext;
        _logger = logger;
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

    public async Task<ConnectionResponse> Connect(ConnectionRequest request, CancellationToken cancellationToken = default)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation("Connection attempt started for URL: {Url}, Database: {Database}, User: {User}", 
            request.Url, request.Database, request.Username);

        try
        {
            var sessionName = !string.IsNullOrEmpty(request.SessionName) 
                ? request.SessionName 
                : (GetSessionId() ?? "default");

            _logger.LogDebug("Target session name: {SessionName}", sessionName);

            // Phase 1: Create Connection Object (Fast)
            HttpServerConnection connection = IomFactory.CreateHttpServerConnection(
                request.Url,
                request.Database,
                request.Username,
                request.Password
            );

            _logger.LogInformation("IOM Connection object created in {ElapsedMs}ms. Starting Login()...", sw.ElapsedMilliseconds);

            // Phase 2: Login (Potentially Slow/Blocking)
            // We use Task.Run to offload the synchronous IOM Login call and WaitAsync for the timeout.
            var loginTask = Task.Run(() => 
            {
                var loginSw = Stopwatch.StartNew();
                try 
                {
                    Item result = connection.Login();
                    _logger.LogInformation("IOM Login() internal call completed in {ElapsedMs}ms", loginSw.ElapsedMilliseconds);
                    return result;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "IOM Login() threw an exception after {ElapsedMs}ms", loginSw.ElapsedMilliseconds);
                    throw;
                }
            }, cancellationToken);

            Item loginResult;
            try 
            {
                loginResult = await loginTask.WaitAsync(TimeSpan.FromSeconds(DefaultTimeoutSeconds), cancellationToken);
            }
            catch (TimeoutException)
            {
                _logger.LogWarning("Connection attempt timed out after {Timeout}s for {Url}", DefaultTimeoutSeconds, request.Url);
                throw new ArasInfrastructureException($"Connection timed out after {DefaultTimeoutSeconds}s. Please check your network and Aras server status.");
            }

            if (loginResult.isError())
            {
                _logger.LogWarning("Login failed for {User}: {Error}", request.Username, loginResult.getErrorString());
                throw new ArasAuthException(loginResult.getErrorString());
            }

            Innovator innovator = loginResult.getInnovator();
            
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

            _connectionStore.AddSession(sessionName, session);

            _logger.LogInformation("Connected successfully to {Url} in {TotalMs}ms", request.Url, sw.ElapsedMilliseconds);

            return new ConnectionResponse
            {
                Success = true,
                Message = "Successfully connected",
                ServerInfo = session.ServerInfo,
                SessionName = sessionName
            };
        }
        catch (ArasException ex)
        {
            _logger.LogError(ex, "Aras specific error during connection after {TotalMs}ms", sw.ElapsedMilliseconds);
            throw; 
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Connection attempt cancelled by user/client after {TotalMs}ms", sw.ElapsedMilliseconds);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected infrastructure error during connection after {TotalMs}ms", sw.ElapsedMilliseconds);
            throw new ArasInfrastructureException($"Connection failed: {ex.Message}");
        }
    }

    public Task<ConnectionResponse> Disconnect(CancellationToken cancellationToken = default)
    {
        var sessionId = GetSessionId();
        if (string.IsNullOrEmpty(sessionId)) 
            return Task.FromResult(new ConnectionResponse { Success = true, Message = "Already disconnected" });

        return DisconnectSession(sessionId, cancellationToken);
    }

    public Task<ConnectionResponse> DisconnectSession(string sessionName, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Disconnecting session: {SessionName}", sessionName);
        _connectionStore.RemoveSession(sessionName);
        return Task.FromResult(new ConnectionResponse { Success = true, Message = $"Session '{sessionName}' disconnected" });
    }

    public Task<AllSessionsResponse> GetAllSessions(CancellationToken cancellationToken = default)
    {
        var allSessions = _connectionStore.GetAllSessions();
        var currentSessionName = GetSessionId() ?? "";

        foreach (var s in allSessions)
        {
            if (s.Name == currentSessionName) s.IsCurrent = true;
        }

        return Task.FromResult(new AllSessionsResponse
        {
             Sessions = allSessions,
             CurrentSession = currentSessionName
        });
    }

    public Task<ConnectionStatusResponse> GetStatus(CancellationToken cancellationToken = default)
    {
        var session = GetCurrentSession();
        return Task.FromResult(new ConnectionStatusResponse
        {
            IsConnected = session != null,
            Status = session != null ? "Connected" : "Disconnected",
            ServerInfo = session?.ServerInfo
        });
    }

    public async Task<ConnectionResponse> ValidateConnection(CancellationToken cancellationToken = default)
    {
        var session = GetCurrentSession();
        if (session == null) throw new ArasAuthException("Not connected");

        return await Task.Run(() => 
        {
            return Execute(inn =>
            {
                var userId = inn.getUserID();
                Item userItem = inn.getItemById("User", userId);
                
                if (userItem.isError())
                    throw new ArasAuthException($"Validation failed: {userItem.getErrorString()}");
                
                var userName = userItem.getProperty("keyed_name", "Unknown");
                return new ConnectionResponse
                {
                    Success = true,
                    Message = $"Valid. User: {userName}",
                    ServerInfo = session.ServerInfo,
                    SessionName = GetSessionId()
                };
            });
        }, cancellationToken);
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
