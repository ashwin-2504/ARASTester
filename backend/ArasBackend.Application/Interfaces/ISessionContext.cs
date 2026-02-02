namespace ArasBackend.Application.Interfaces;

/// <summary>
/// Provides access to the current session context (Session ID).
/// This service is expected to be Scoped (per-request) in a web environment.
/// Outside of a web context (e.g. CLI or Background Job), it may return null or a fixed session.
/// </summary>
public interface ISessionContext
{
    /// <summary>
    /// The unique identifier for the current Aras session.
    /// Acts as a key to look up the connection in the IConnectionStore.
    /// </summary>
    string? SessionId { get; }
}
