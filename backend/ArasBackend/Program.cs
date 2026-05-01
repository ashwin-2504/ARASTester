using ArasBackend.Middleware;
using global::ArasBackend.Infrastructure;
using global::ArasBackend.Application;
using ArasBackend.HealthChecks;
using ArasBackend.Options;
using ArasBackend.Infrastructure.Options;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var isDevelopment = builder.Environment.IsDevelopment();

// Add services to the container.
builder.Services.AddCors(options =>
{
    var allowedOrigins =
        builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
        ?? Array.Empty<string>();

    if (!isDevelopment && allowedOrigins.Length == 0)
    {
        throw new InvalidOperationException("Missing CORS configuration. Configure Cors:AllowedOrigins for non-development environments.");
    }

    options.AddPolicy("AllowLocalhost",
        policy =>
        {
            if (isDevelopment)
            {
                // In development, allow any localhost origin to support dynamic ports
                policy.SetIsOriginAllowed(origin => 
                {
                    if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return uri.Host == "localhost";
                    }
                    return false;
                })
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            }
            else
            {
                // In production, strictly enforce configured origins
                policy.WithOrigins(allowedOrigins.Distinct().ToArray())
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
        });
});
builder.Services.Configure<GatewayResponseOptions>(builder.Configuration.GetSection("Aras:GatewayResponse"));
builder.Services.Configure<SessionStoreOptions>(builder.Configuration.GetSection("Aras:SessionStore"));
builder.Services.Configure<SessionResolutionOptions>(builder.Configuration.GetSection("Aras"));
builder.Services.Configure<UtilityExecutionOptions>(builder.Configuration.GetSection("Aras:UtilityExecution"));
builder.Services.Configure<DangerousExecutionOptions>(builder.Configuration.GetSection("Aras:DangerousExecution"));

// Register Architecture Layers
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ArasBackend.Application.Interfaces.ISessionContext, ArasBackend.Services.WebSessionContext>();
builder.Services.AddScoped<ArasBackend.Middleware.ArasAuthorizeAttribute>(); // Register Filter

builder.Services.AddInfrastructure();
builder.Services.AddApplication();
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // This ensures [ApiController] returns 400 for validation errors automatically
        options.SuppressModelStateInvalidFilter = false;
    });
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks()
    .AddCheck("backend", () => HealthCheckResult.Healthy("Backend process is running."))
    .AddCheck<ArasConnectivityHealthCheck>("aras-connectivity");

var app = builder.Build();

app.UseExceptionHandler();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowLocalhost");

// Status endpoint
app.MapGet("/api/status", () =>
{
    return new { status = "online", timestamp = DateTime.UtcNow };
});
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var payload = new
        {
            status = report.Status.ToString(),
            traceId = context.TraceIdentifier,
            checks = report.Entries.ToDictionary(
                entry => entry.Key,
                entry => new
                {
                    status = entry.Value.Status.ToString(),
                    description = entry.Value.Description,
                    durationMs = entry.Value.Duration.TotalMilliseconds
                })
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
});

app.MapControllers();

app.Run();
