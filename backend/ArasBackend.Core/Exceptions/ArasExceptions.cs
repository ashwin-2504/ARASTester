namespace ArasBackend.Core.Exceptions;

public abstract class ArasException : Exception
{
    protected ArasException(string message) : base(message) { }
}

public class ArasAuthException : ArasException
{
    public ArasAuthException(string message) : base(message) { }
}

public class ArasNotFoundException : ArasException
{
    public ArasNotFoundException(string message) : base(message) { }
}

public class ArasValidationException : ArasException
{
    public ArasValidationException(string message) : base(message) { }
}

public class ArasInfrastructureException : ArasException
{
    public ArasInfrastructureException(string message) : base(message) { }
}
