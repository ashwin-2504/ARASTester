namespace ArasBackend.Options;

public class SessionResolutionOptions
{
    public string SessionCookieName { get; set; } = "ARAS_SESSION_ID";
    public string SessionHeaderName { get; set; } = "X-Session-Name";
}
