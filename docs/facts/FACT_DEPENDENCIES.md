# FACT_DEPENDENCIES

**Source**: `package.json`, `backend/**/*.csproj`
**Extraction Date**: 2026-01-20
**Constraint**: Only top-level declared dependencies. Transitive dependencies excluded.

---

## Frontend Dependencies (`package.json`)

### Production Dependencies
| Package | Version |
|---------|---------|
| @hello-pangea/dnd | ^18.0.1 |
| @radix-ui/react-dialog | ^1.1.15 |
| @radix-ui/react-dropdown-menu | ^2.1.16 |
| @radix-ui/react-scroll-area | ^1.2.10 |
| @radix-ui/react-slot | ^1.2.4 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| immer | ^11.1.3 |
| lucide-react | ^0.554.0 |
| react | ^19.2.0 |
| react-dom | ^19.2.0 |
| react-router-dom | ^7.12.0 |
| tailwind-merge | ^3.4.0 |
| tailwindcss-animate | ^1.0.7 |
| zustand | ^5.0.10 |

### Dev Dependencies
| Package | Version |
|---------|---------|
| @types/node | ^25.0.9 |
| @types/react | ^19.2.9 |
| @types/react-dom | ^19.2.3 |
| @typescript-eslint/eslint-plugin | ^8.54.0 |
| @typescript-eslint/parser | ^8.54.0 |
| @vitejs/plugin-react | ^5.1.1 |
| autoprefixer | ^10.4.22 |
| eslint | ^8.57.1 |
| eslint-plugin-react | ^7.37.5 |
| eslint-plugin-react-hooks | ^7.0.1 |
| postcss | ^8.5.6 |
| tailwindcss | ^3.4.17 |
| typescript | ^5.9.3 |
| vite | ^7.2.2 |

---

## Backend Dependencies (`.csproj` files)

### ArasBackend (`backend/ArasBackend/ArasBackend.csproj`)
| Package | Version |
|---------|---------|
| Aras.IOM | 15.0.1 |
| Swashbuckle.AspNetCore | 6.4.0 |

**SDK**: `Microsoft.NET.Sdk.Web`
**Target Framework**: `net8.0`

**Project References**:
- `../ArasBackend.Core/ArasBackend.Core.csproj`
- `../ArasBackend.Application/ArasBackend.Application.csproj`
- `../ArasBackend.Infrastructure/ArasBackend.Infrastructure.csproj`

### ArasBackend.Core (`backend/ArasBackend.Core/ArasBackend.Core.csproj`)
| Package | Version |
|---------|---------|
| (none) | - |

**SDK**: `Microsoft.NET.Sdk`
**Target Framework**: `net8.0`

### ArasBackend.Application (`backend/ArasBackend.Application/ArasBackend.Application.csproj`)
| Package | Version |
|---------|---------|
| Microsoft.Extensions.DependencyInjection.Abstractions | 10.0.2 |

**SDK**: `Microsoft.NET.Sdk`
**Target Framework**: `net8.0`

**Project References**:
- `../ArasBackend.Core/ArasBackend.Core.csproj`

### ArasBackend.Infrastructure (`backend/ArasBackend.Infrastructure/ArasBackend.Infrastructure.csproj`)
| Package | Version |
|---------|---------|
| Aras.IOM | 15.0.1 |
| Microsoft.Extensions.DependencyInjection.Abstractions | 10.0.2 |

**SDK**: `Microsoft.NET.Sdk`
**Target Framework**: `net8.0`

**Framework References**:
- `Microsoft.AspNetCore.App`

**Project References**:
- `../ArasBackend.Core/ArasBackend.Core.csproj`
