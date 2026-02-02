# FACT_DOMAIN_TERMS

**Source**: `backend/ArasBackend.Core/Models/ArasModels.cs`
**Extraction Date**: 2026-02-28
**Constraint**: Definitions of key domain entities used in API contracts.

---

## Request/Response Models (`backend/ArasBackend.Core/Models/ArasModels.cs`)

### ServerInfo (Lines 5-11)
| Property | Type | Required |
|----------|------|----------|
| Database | string | Yes |
| UserId | string | Yes |
| UserName | string | Yes |
| Url | string | Yes |

### ConnectionRequest (Lines 13-19)
| Property | Type | Required |
|----------|------|----------|
| Url | string | Yes |
| Database | string | Yes |
| Username | string | Yes |
| Password | string | Yes |

### ConnectionResponse (Lines 21-26)
| Property | Type | Required |
|----------|------|----------|
| Success | bool | No |
| Message | string? | No |
| ServerInfo | ServerInfo? | No |
| SessionName | string? | No |

### ConnectionStatusResponse (Lines 28-33)
| Property | Type | Required |
|----------|------|----------|
| IsConnected | bool | No |
| Status | string | Yes |
| ServerInfo | ServerInfo? | No |

### QueryRequest (Lines 35-42)
| Property | Type | Default | Required |
|----------|------|---------|----------|
| ItemType | string | - | Yes |
| Select | string? | - | No |
| Page | int | 1 | No |
| PageSize | int | 100 | No |
| Criteria | Dictionary<string, string>? | - | No |

### GetByIdRequest (Lines 44-49)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| Select | string? | No |

### GetByKeyedNameRequest (Lines 51-55)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| KeyedName | string | Yes |

### CreateItemRequest (Lines 57-61)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Properties | Dictionary<string, string> | Yes |

### UpdateItemRequest (Lines 63-68)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| Properties | Dictionary<string, string> | Yes |

### DeleteItemRequest (Lines 70-74)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |

### LockRequest (Lines 76-80)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |

### PromoteRequest (Lines 82-88)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| TargetState | string | Yes |
| Comments | string? | No |

### ApplyAmlRequest (Lines 90-93)
| Property | Type | Required |
|----------|------|----------|
| Aml | string | Yes |

### ApplySqlRequest (Lines 95-98)
| Property | Type | Required |
|----------|------|----------|
| Sql | string | Yes |

### ApplyMethodRequest (Lines 100-104)
| Property | Type | Required |
|----------|------|----------|
| MethodName | string | Yes |
| Body | string? | No |

### AssertExistsRequest (Lines 106-110)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Criteria | Dictionary<string, string> | Yes |

### AssertPropertyRequest (Lines 112-118)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| Property | string | Yes |
| Expected | string? | No |

### AddRelationshipRequest (Lines 120-127)
| Property | Type | Required |
|----------|------|----------|
| ParentType | string | Yes |
| ParentId | string | Yes |
| RelationshipType | string | Yes |
| RelatedId | string | Yes |
| Properties | Dictionary<string, string>? | No |

### GetRelationshipsRequest (Lines 129-135)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| RelationshipType | string | Yes |
| Select | string? | No |

### DeleteRelationshipRequest (Lines 137-141)
| Property | Type | Required |
|----------|------|----------|
| RelationshipType | string | Yes |
| RelationshipId | string | Yes |

### AssertStateRequest (Lines 143-148)
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| ExpectedState | string | Yes |

### StartWorkflowRequest
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| WorkflowMap | string? | No |

### CompleteActivityRequest
| Property | Type | Required |
|----------|------|----------|
| ActivityId | string | Yes |
| Path | string | Yes |
| Comments | string? | No |

### AssertPropertyContainsRequest
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| Property | string | Yes |
| Contains | string | Yes |

### AssertCountRequest
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Criteria | Dictionary<string, string> | Yes |
| ExpectedCount | int | No |

### UploadFileRequest
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| PropertyName | string | Yes |
| FilePath | string | Yes |

### DownloadFileRequest
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| PropertyName | string | Yes |
| SavePath | string | Yes |

### VerifyFileExistsRequest
| Property | Type | Required |
|----------|------|----------|
| ItemType | string | Yes |
| Id | string | Yes |
| PropertyName | string | Yes |

### GetNextSequenceRequest
| Property | Type | Required |
|----------|------|----------|
| SequenceName | string | Yes |

### SetVariableRequest
| Property | Type | Required |
|----------|------|----------|
| VariableName | string | Yes |
| Value | object? | No |

### LogMessageRequest
| Property | Type | Required |
|----------|------|----------|
| Message | string | Yes |

### WaitRequest
| Property | Type | Required |
|----------|------|----------|
| Duration | int | No |

### ItemResponse (Lines 150-156)
| Property | Type | Required |
|----------|------|----------|
| Success | bool | No |
| Message | string? | No |
| Data | object? | No |
| ItemCount | int | No |

### AssertionResponse (Lines 158-165)
| Property | Type | Required |
|----------|------|----------|
| Success | bool | No |
| Passed | bool | No |
| Message | string? | No |
| ActualValue | string? | No |
| ExpectedValue | string? | No |

---

## Domain Vocabulary (from code symbols)

| Term | Meaning (derived from usage) | File |
|------|------------------------------|------|
| ItemType | ARAS item type name (e.g., Part, Document) | ArasModels.cs |
| KeyedName | ARAS unique keyed name identifier | ArasModels.cs |
| Criteria | Dictionary of property name/value filter pairs | ArasModels.cs |
| RelationshipType | ARAS relationship type name (e.g., Part BOM) | ArasModels.cs |
| TargetState | Lifecycle state to promote to | ArasModels.cs |
| Aml | ARAS Markup Language query string | ArasModels.cs |
| Innovator | ARAS IOM Innovator object (from `Aras.IOM`) | ArasGateway.cs |
