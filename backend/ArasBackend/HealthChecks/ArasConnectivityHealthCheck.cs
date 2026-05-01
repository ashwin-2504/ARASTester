using ArasBackend.Infrastructure.Services;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArasBackend.HealthChecks;

public class ArasConnectivityHealthCheck : IHealthCheck
{
    private readonly IConnectionStore _connectionStore;

    public ArasConnectivityHealthCheck(IConnectionStore connectionStore)
    {
        _connectionStore = connectionStore;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var sessions = _connectionStore.GetAllSessions();
        if (sessions.Count == 0)
        {
            return Task.FromResult(HealthCheckResult.Degraded("No active ARAS session available for connectivity probe."));
        }

        return Task.FromResult(HealthCheckResult.Healthy("ARAS session connectivity available.", new Dictionary<string, object>
        {
            ["activeSessionCount"] = sessions.Count
        }));
    }
}
