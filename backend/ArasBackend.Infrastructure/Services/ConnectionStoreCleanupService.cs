using ArasBackend.Infrastructure.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Services;

public class ConnectionStoreCleanupService : BackgroundService
{
    private readonly IConnectionStore _connectionStore;
    private readonly ILogger<ConnectionStoreCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval;

    public ConnectionStoreCleanupService(
        IConnectionStore connectionStore,
        IOptions<SessionStoreOptions> sessionStoreOptions,
        ILogger<ConnectionStoreCleanupService> logger)
    {
        _connectionStore = connectionStore;
        _logger = logger;
        _cleanupInterval = TimeSpan.FromMinutes(Math.Max(1, sessionStoreOptions.Value.CleanupIntervalMinutes));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_cleanupInterval);
        while (!stoppingToken.IsCancellationRequested
               && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                var removed = _connectionStore.CleanupExpiredSessions();
                if (removed > 0)
                {
                    _logger.LogInformation("Connection store cleanup removed {RemovedSessionCount} expired sessions", removed);
                }
            }
            catch (OperationCanceledException)
            {
                // Shutdown path.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Connection store cleanup failed");
            }
        }
    }
}
