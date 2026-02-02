using ArasBackend.Application.Services;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using Moq;
using Xunit;

namespace ArasBackend.Tests.Services;

public class ItemAppServiceTests
{
    private readonly Mock<IArasGateway> _mockGateway;
    private readonly ItemAppService _service;

    public ItemAppServiceTests()
    {
        _mockGateway = new Mock<IArasGateway>();
        _service = new ItemAppService(_mockGateway.Object);
    }

    [Fact]
    public async Task GetItemById_ShouldReturnItem_WhenFound()
    {
        // Arrange
        var request = new GetByIdRequest { ItemType = "Part", Id = "12345" };
        var expectedResponse = new ItemResponse 
        { 
            Success = true, 
            Data = new List<Dictionary<string, object>> { new() { ["id"] = "12345" } } 
        };

        _mockGateway.Setup(g => g.GetItemById(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _service.GetItemById(request);

        // Assert
        Assert.True(result.Success);
        var items = result.Data as List<Dictionary<string, object>>;
        Assert.NotNull(items);
        Assert.Single(items);
        Assert.Equal("12345", items[0]["id"]);
    }

    [Fact]
    public async Task GetItemById_ShouldThrow_WhenGatewayFails()
    {
        // Arrange
        var request = new GetByIdRequest { ItemType = "Part", Id = "12345" };
        _mockGateway.Setup(g => g.GetItemById(request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArasBackend.Core.Exceptions.ArasInfrastructureException("Gateway Error"));

        // Act & Assert
        await Assert.ThrowsAsync<ArasBackend.Core.Exceptions.ArasInfrastructureException>(() => _service.GetItemById(request));
    }
}
