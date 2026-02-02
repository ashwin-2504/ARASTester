using System.Net;
using System.Text.Json;
using ArasBackend.Core.Exceptions;

namespace ArasBackend.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new ErrorResponse
        {
            Success = false,
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            case ArasAuthException authEx:
                response.Message = authEx.Message;
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                _logger.LogWarning(authEx, "Authentication failure");
                break;
                
            case ArasNotFoundException notFoundEx:
                response.Message = notFoundEx.Message;
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                _logger.LogWarning(notFoundEx, "Resource not found");
                break;
                
            case ArasValidationException validationEx:
                response.Message = validationEx.Message;
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                _logger.LogWarning(validationEx, "Validation error");
                break;
                
            case ArasInfrastructureException infraEx:
                response.Message = "External system failure";
                // Only expose infrastructure details in Development
                if (_env.IsDevelopment())
                {
                    response.Detail = infraEx.Message;
                }
                else
                {
                    response.Detail = "See server logs for details.";
                }
                
                context.Response.StatusCode = (int)HttpStatusCode.BadGateway;
                _logger.LogError(infraEx, "Infrastructure failure");
                break;
                
            default:
                response.Message = "An internal server error occurred.";
                // In production, don't expose stack trace/details
                // response.Detail = exception.Message; 
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                _logger.LogError(exception, "Unhandled exception");
                break;
        }

        var json = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(json);
    }
}

public class ErrorResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public DateTime Timestamp { get; set; }
}
