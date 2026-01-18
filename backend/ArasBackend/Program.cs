
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

// Validate Connection - Test if connection is still valid by querying current user
app.MapGet("/api/aras/validate", (ArasConnectionService arasService) =>
{
    var response = arasService.ValidateConnection();
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// ==================== CRUD Operations ====================

// Query Items
app.MapPost("/api/aras/query", (QueryRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.QueryItems(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// Get Item by ID
app.MapPost("/api/aras/get-by-id", (GetByIdRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.GetItemById(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// Get Item by Keyed Name
app.MapPost("/api/aras/get-by-keyed-name", (GetByKeyedNameRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.GetItemByKeyedName(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// Create Item
app.MapPost("/api/aras/create", (CreateItemRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.CreateItem(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// Update Item
app.MapPost("/api/aras/update", (UpdateItemRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.UpdateItem(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// Delete Item
app.MapPost("/api/aras/delete", (DeleteItemRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.DeleteItem(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// Purge Item
app.MapPost("/api/aras/purge", (DeleteItemRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.PurgeItem(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// ==================== Lock Operations ====================

app.MapPost("/api/aras/lock", (LockRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.LockItem(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

app.MapPost("/api/aras/unlock", (LockRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.UnlockItem(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

app.MapPost("/api/aras/check-lock", (LockRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.CheckLockStatus(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// ==================== Lifecycle Operations ====================

app.MapPost("/api/aras/promote", (PromoteRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.PromoteItem(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

app.MapPost("/api/aras/get-state", (GetByIdRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.GetCurrentState(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// ==================== AML & SQL ====================

app.MapPost("/api/aras/apply-aml", (ApplyAmlRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.ApplyAML(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

app.MapPost("/api/aras/apply-sql", (ApplySqlRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.ApplySQL(request);
    return response.Success ? Results.Ok(response) : Results.BadRequest(response);
});

// ==================== Assertions ====================

app.MapPost("/api/aras/assert-exists", (AssertExistsRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.AssertItemExists(request);
    return Results.Ok(response);
});

app.MapPost("/api/aras/assert-not-exists", (AssertExistsRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.AssertItemNotExists(request);
    return Results.Ok(response);
});

app.MapPost("/api/aras/assert-property", (AssertPropertyRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.AssertPropertyValue(request);
    return Results.Ok(response);
});

app.MapPost("/api/aras/assert-state", (AssertStateRequest request, ArasConnectionService arasService) =>
{
    var response = arasService.AssertState(request);
    return Results.Ok(response);
});

app.Run();
