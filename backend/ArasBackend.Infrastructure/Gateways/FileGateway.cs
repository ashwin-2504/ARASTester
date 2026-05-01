using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ArasBackend.Core.Interfaces;
using ArasBackend.Core.Models;
using ArasBackend.Infrastructure.Options;
using ArasBackend.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace ArasBackend.Infrastructure.Gateways;

public class FileGateway : BaseGateway, IFileGateway
{
    public FileGateway(ArasSessionManager sessionManager, IOptions<GatewayResponseOptions> gatewayResponseOptions) : base(sessionManager, gatewayResponseOptions)
    {
    }

    public Task<ItemResponse> UploadFile(UploadFileRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.newItem(request.ItemType, "edit");
            item.setID(request.Id);
            item.setFileProperty(request.PropertyName, request.FilePath);
            return item.apply();
        }, "File uploaded"), cancellationToken);
    }

    public Task<ItemResponse> DownloadFile(DownloadFileRequest request, CancellationToken cancellationToken = default)
    {
        return RunAsync(() => ExecuteIom(inn =>
        {
            var item = inn.getItemById(request.ItemType, request.Id);
            if (item.isError()) return item;

            var fileId = item.getProperty(request.PropertyName);
            if (string.IsNullOrEmpty(fileId))
                return inn.newError("File property is empty");

            var fileItem = inn.getItemById("File", fileId);
            if (fileItem.isError()) return fileItem;

            var dir = Path.GetDirectoryName(request.SavePath);
            if (string.IsNullOrEmpty(dir)) dir = request.SavePath; // Fallback if no dir component

            return fileItem.checkout(dir);
        }, "File downloaded"), cancellationToken);
    }
}
