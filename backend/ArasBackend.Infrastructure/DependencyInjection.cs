using Microsoft.Extensions.DependencyInjection;
using ArasBackend.Core.Interfaces;
using ArasBackend.Infrastructure.Services;
using ArasBackend.Infrastructure.Gateways;

namespace ArasBackend.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<IConnectionStore, ConnectionStore>();
        
        services.AddScoped<ArasSessionManager>();
        services.AddScoped<IArasSessionManager>(sp => sp.GetRequiredService<ArasSessionManager>());
        
        // Gateway depends on SessionManager, providing the scoped instance
        services.AddScoped<IArasGateway, ArasGateway>();
        
        return services;
    }
}
