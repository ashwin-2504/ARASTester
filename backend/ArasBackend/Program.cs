using ArasBackend.Models;
using ArasBackend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // Allow common frontend ports
                  .SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost") // Allow any localhost port
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Register ARAS Connection Service as singleton (maintains connection state)
builder.Services.AddSingleton<ArasConnectionService>();

var app = builder.Build();

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

// ARAS Connection endpoints
app.MapPost("/api/aras/connect", (ConnectionRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.Connect(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

app.MapPost("/api/aras/disconnect", (ArasConnectionService arasService) =>
{
    var response = arasService.Disconnect();
    return Results.Ok(response);
});

app.MapGet("/api/aras/connection-status", (ArasConnectionService arasService) =>
{
    var status = arasService.GetStatus();
    return Results.Ok(status);
});

app.Run();
