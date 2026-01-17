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

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowLocalhost");

app.MapGet("/api/status", () =>
{
    return new { status = "online", timestamp = DateTime.UtcNow };
});

app.Run();
