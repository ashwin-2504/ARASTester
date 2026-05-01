namespace ArasBackend.Infrastructure.Options;

public class SessionStoreOptions
{
    public int SessionTimeoutHours { get; set; } = 4;
    public int CleanupIntervalMinutes { get; set; } = 30;
    public int LogoutTimeoutSeconds { get; set; } = 5;
    public int MaxSessionVariables { get; set; } = 256;
    public int MaxTestLogEntries { get; set; } = 1000;
    public int MaxLogMessageLength { get; set; } = 2000;
}
