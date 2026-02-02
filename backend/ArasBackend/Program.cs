
using ArasBackend.Middleware;
using global::ArasBackend.Infrastructure;
using global::ArasBackend.Application;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    
    if (allowedOrigins.Length == 0)
    {
        // Fail fast or warn
        Console.WriteLine("WARNING: No CORS AllowedOrigins configured.");
    }

    options.AddPolicy("AllowLocalhost",
        policy =>
        {
            if (builder.Environment.IsDevelopment())
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
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
        });
});

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

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowLocalhost");

// Status endpoint
app.MapGet("/api/status", () =>
{
    return new { status = "online", timestamp = DateTime.UtcNow };
});

app.MapControllers();

app.Run();
