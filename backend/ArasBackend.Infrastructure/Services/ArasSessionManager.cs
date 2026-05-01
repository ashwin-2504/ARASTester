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
using ArasBackend.Infrastructure.Options;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Services;

public class ArasSessionManager : IArasSessionManager
{
    private readonly IConnectionStore _connectionStore;
    private readonly ISessionContext _sessionContext;
    private readonly ILogger<ArasSessionManager> _logger;
    private readonly SessionStoreOptions _sessionStoreOptions;
    private const int DefaultTimeoutSeconds = 120;

    public ArasSessionManager(
        IConnectionStore connectionStore, 
        ISessionContext sessionContext,
        ILogger<ArasSessionManager> logger,
        IOptions<SessionStoreOptions> sessionStoreOptions)
    {
        _connectionStore = connectionStore;
        _sessionContext = sessionContext;
        _logger = logger;
        _sessionStoreOptions = sessionStoreOptions.Value;
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

    public Task<ConnectionResponse> Connect(ConnectionRequest request, CancellationToken cancellationToken = default)
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
            connection.Timeout = DefaultTimeoutSeconds * 1000; // IOM expects milliseconds

            _logger.LogInformation("IOM Connection object created in {ElapsedMs}ms. Starting Login()...", sw.ElapsedMilliseconds);

            cancellationToken.ThrowIfCancellationRequested();

            // IOM login is synchronous and not cancellable once started.
            var loginSw = Stopwatch.StartNew();
            Item loginResult;
            try
            {
                loginResult = connection.Login();
                _logger.LogInformation("IOM Login() internal call completed in {ElapsedMs}ms", loginSw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IOM Login() threw an exception after {ElapsedMs}ms", loginSw.ElapsedMilliseconds);
                throw;
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

            return Task.FromResult(new ConnectionResponse
            {
                Success = true,
                Message = "Successfully connected",
                ServerInfo = session.ServerInfo,
                SessionName = sessionName
            });
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

    public Task<ConnectionResponse> ValidateConnection(CancellationToken cancellationToken = default)
    {
        var session = GetCurrentSession();
        if (session == null) throw new ArasAuthException("Not connected");

        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(
            Execute(inn =>
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
            }));
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
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArasValidationException("Variable name is required.");
        }

        var session = GetCurrentSession();
        if (session == null) throw new ArasAuthException("Session is not active.");

        var maxVariables = Math.Max(1, _sessionStoreOptions.MaxSessionVariables);
        lock (session.Lock)
        {
            if (value == null)
            {
                session.Variables.Remove(name);
                return;
            }

            var isNewKey = !session.Variables.ContainsKey(name);
            if (isNewKey)
            {
                while (session.Variables.Count >= maxVariables && session.VariableInsertionOrder.Count > 0)
                {
                    var keyToEvict = session.VariableInsertionOrder.Dequeue();
                    if (session.Variables.Remove(keyToEvict))
                    {
                        _logger.LogWarning("Session variable cap reached. Evicted variable '{VariableName}'", keyToEvict);
                    }
                }

                if (session.Variables.Count >= maxVariables)
                {
                    _logger.LogWarning("Session variable cap reached. Dropped new variable '{VariableName}'", name);
                    return;
                }

                session.VariableInsertionOrder.Enqueue(name);
            }

            session.Variables[name] = value;
        }
    }

    internal void AddSessionLog(string message)
    {
        var session = GetCurrentSession();
        if (session != null)
        {
            var maxLogEntries = Math.Max(1, _sessionStoreOptions.MaxTestLogEntries);
            var maxMessageLength = Math.Max(1, _sessionStoreOptions.MaxLogMessageLength);

            lock (session.Lock)
            {
                var normalized = message ?? string.Empty;
                if (normalized.Length > maxMessageLength)
                {
                    _logger.LogWarning("Session log message length exceeded cap ({MaxMessageLength}). Message truncated.", maxMessageLength);
                    normalized = normalized[..maxMessageLength];
                }

                session.TestLogs.Add($"[{DateTime.UtcNow:O}] {normalized}");

                if (session.TestLogs.Count > maxLogEntries)
                {
                    var removeCount = session.TestLogs.Count - maxLogEntries;
                    session.TestLogs.RemoveRange(0, removeCount);
                    _logger.LogWarning("Session test log cap reached. Dropped {DroppedLogCount} old log entries.", removeCount);
                }
            }
        }
    }
}
