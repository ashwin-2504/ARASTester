using Microsoft.Extensions.DependencyInjection;
using ArasBackend.Application.Services;

namespace ArasBackend.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ConnectionAppService>();
        services.AddScoped<ItemAppService>();
        return services;
    }
}
