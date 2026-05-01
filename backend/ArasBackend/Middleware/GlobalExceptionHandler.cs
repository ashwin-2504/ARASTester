using System.Diagnostics;
using ArasBackend.Core.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ArasBackend.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetailsService;
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionHandler(
        IProblemDetailsService problemDetailsService,
        ILogger<GlobalExceptionHandler> logger,
        IWebHostEnvironment environment)
    {
        _problemDetailsService = problemDetailsService;
        _logger = logger;
        _environment = environment;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, title) = exception switch
        {
            ArasAuthException => (StatusCodes.Status401Unauthorized, "Authentication failed"),
            ArasNotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
            ArasValidationException => (StatusCodes.Status400BadRequest, "Validation error"),
            ArasInfrastructureException => (StatusCodes.Status503ServiceUnavailable, "Infrastructure error"),
            OperationCanceledException => (499, "Request cancelled"),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected error")
        };

        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled server exception. TraceId: {TraceId}", httpContext.TraceIdentifier);
        }
        else
        {
            _logger.LogWarning(exception, "{ErrorTitle}. TraceId: {TraceId}", title, httpContext.TraceIdentifier);
        }

        var correlationId = httpContext.Request.Headers["X-Correlation-ID"].FirstOrDefault();
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = _environment.IsDevelopment() ? exception.ToString() : exception.Message,
            Type = $"https://httpstatuses.com/{statusCode}",
            Instance = httpContext.Request.Path
        };

        problem.Extensions["traceId"] = httpContext.TraceIdentifier;
        problem.Extensions["correlationId"] = string.IsNullOrWhiteSpace(correlationId) ? Activity.Current?.Id : correlationId;

        httpContext.Response.StatusCode = statusCode;
        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception
        });
    }
}
