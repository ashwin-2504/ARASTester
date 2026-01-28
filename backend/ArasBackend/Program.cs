
using ArasBackend.Middleware;
using global::ArasBackend.Infrastructure;
using global::ArasBackend.Application;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                  .SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Register Architecture Layers
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ArasBackend.Application.Interfaces.ISessionContext, ArasBackend.Services.WebSessionContext>();

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
