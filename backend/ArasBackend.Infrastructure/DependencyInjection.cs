using Microsoft.Extensions.DependencyInjection;
using ArasBackend.Core.Interfaces;
using ArasBackend.Infrastructure.Services;
using ArasBackend.Infrastructure.Gateways;

namespace ArasBackend.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IConnectionStore, ConnectionStore>();
        
        services.AddScoped<ArasSessionManager>();
        services.AddScoped<IArasSessionManager>(sp => sp.GetRequiredService<ArasSessionManager>());
        
        services.AddScoped<IItemGateway, ItemGateway>();
        services.AddScoped<IWorkflowGateway, WorkflowGateway>();
        services.AddScoped<IAssertionGateway, AssertionGateway>();
        services.AddScoped<IFileGateway, FileGateway>();
        services.AddScoped<IUtilityGateway, UtilityGateway>();        
        return services;
    }
}
