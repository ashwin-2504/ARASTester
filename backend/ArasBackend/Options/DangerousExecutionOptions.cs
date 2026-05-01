namespace ArasBackend.Options;

public class DangerousExecutionOptions
{
    public bool Enabled { get; set; }
    public string[] AllowedEnvironments { get; set; } = new[] { "Development" };
}
