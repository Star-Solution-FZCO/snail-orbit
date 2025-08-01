# ACL System Documentation

## Core Principles

1. **Dual Permission Architecture**: Role-based and claim-based collaborative permissions for domain entities (projects/issues) and direct sharing for tools (boards/reports), matching complexity to use case requirements

2. **Security by Default**: Access denied unless explicitly granted, with users receiving only minimum necessary permissions

3. **Hybrid Administration Model**: Full system control via admin flag, with selective delegation of specific capabilities (like project creation) through global permissions

4. **Clear System Boundaries**: Explicit separation between system-level operations (admin/global) and resource-level operations (projects/issues/tools)

5. **Flexible Permission Management**: Granular access control within projects and cross-boundary delegation capabilities for external collaboration needs

6. **Permission Inheritance with Override**: Issues inherit project permissions by default but can disable inheritance for confidential access control

7. **Comprehensive Audit Trail**: All permission changes logged with full attribution for security, compliance, and operational transparency

## Permission Types

### Project/Issue Permissions (Role-based + Claim-based)
*Collaborative permissions using roles that resolve to specific permission claims within project contexts*

#### Project Management Claims
- **PROJECT_READ**: View project details, settings, issue lists, boards, project-level information, and custom fields bound to the project
- **PROJECT_UPDATE**: Modify project settings, name, description, configuration, create new custom fields, bind existing fields to project, and edit field definitions (requires PROJECT_UPDATE on all projects where field is bound)
- **PROJECT_DELETE**: Delete the entire project and all its contents
- **PROJECT_MANAGE_PERMISSIONS**: Grant and revoke permissions on the project to users and groups

#### Issue Management Claims
- **ISSUE_CREATE**: Create new issues within the project
- **ISSUE_READ**: View issue details, description, fields, status, and history
- **ISSUE_UPDATE**: Modify issue content, fields, status, tags, and attachments
- **ISSUE_DELETE**: Delete issues from the project
- **ISSUE_MANAGE_PERMISSIONS**: Grant and revoke permissions on specific issues

#### Comment Management Claims
- **COMMENT_READ**: View comments and discussions on issues (separate from ISSUE_READ for granular access)
- **COMMENT_CREATE**: Add new comments to issues
- **COMMENT_UPDATE**: Edit existing comments (business logic determines if user can edit specific comment)
- **COMMENT_DELETE_OWN**: Delete own comments
- **COMMENT_DELETE**: Delete any comment on the issue
- **COMMENT_HIDE**: Hide comments from view (moderation)
- **COMMENT_RESTORE**: Restore hidden comments

#### History Management Claims
- **HISTORY_HIDE**: Hide history records from view (moderation)
- **HISTORY_RESTORE**: Restore hidden history records

### Tool Permissions (Direct Sharing)
*Simple ownership-style permissions for supporting tools using direct permission assignment*

#### Sharing Permission Levels
- **VIEW**: Read access to the tool/resource - can view content but cannot modify
- **EDIT**: Modify the tool/resource content and settings - can change configuration and data
- **ADMIN**: Full control including sharing permissions with others - can manage access and delete

#### Applicable Tools
- **Boards**: Kanban boards and agile planning tools
- **Reports**: Custom reports and data visualizations  
- **Searches**: Saved search queries and filters
- **Tags**: Custom tags and labeling systems

### Global System Permissions
*System-wide permissions that operate independently of any specific project or tool*

#### Delegatable System Operations
- **PROJECT_CREATE**: Create new projects (system-wide capability, delegatable to non-admins through global roles)

#### Admin-Only System Operations
*(Controlled by `is_admin` flag, not delegatable through global permissions)*
- **User Management**: Create, update, delete users and manage user accounts
- **Group Management**: Create, update, delete groups and manage group memberships
- **Role Management**: Create, update, delete roles and manage role permissions
- **Workflow Management**: Create, update, delete workflows and automation scripts
- **System Configuration**: Modify system settings, configuration, and global parameters

## Architecture Implementation

### Dual System Integration

The permission architecture implements two complementary systems that work together:

**Role-based + Claim-based System** (Projects/Issues):
- Users assigned to roles containing specific permission claims
- Complex collaborative permissions with inheritance and override capabilities
- Suitable for multi-user, long-term collaborative entities

**Direct Sharing System** (Tools):
- Users directly assigned VIEW/EDIT/ADMIN permissions on specific resources
- Simple ownership-style permissions for supporting tools
- Suitable for individual-owned, shareable resources

### Role-based System Implementation

**Permission Flow**: `User → Role Assignment → Claim Resolution → Access Decision`

#### Role Types and Assignment

**GlobalRole**: System-wide capability roles
- **Scope**: Entire system, independent of projects
- **Contains**: Global permissions (PROJECT_CREATE)
- **Assignment**: Administrators assign to users directly or to groups
- **Examples**: "Project Creator", "System Auditor"

**ProjectRole**: Project-specific collaborative roles  
- **Scope**: Individual projects only
- **Contains**: Project/issue/comment/history permission claims
- **Assignment**: Project owners or permission managers assign within projects
- **Examples**: "Project Owner", "Developer", "Read Only", "Issue Manager"

#### Permission Resolution Patterns

**Global Permission Resolution** (System Operations):
```
1. Check admin override (is_admin flag) → Full system access if true
2. Check user's GlobalRoles for required global permission
3. Return boolean result (can/cannot perform system operation)
```
*Used for: Project creation, system configuration, user management*

**Project/Issue Permission Resolution** (Resource Operations):
```
1. [Optional] Check admin override based on resource type:
   - Projects: Admin override enabled (system management needs)
   - Issues/Comments: No admin override (privacy protection)
2. Collect project permissions from user's ProjectRoles in context
3. Apply inheritance rules (issues inherit project permissions by default)
4. Apply overrides (disable_project_permissions_inheritance flag)
5. Check required claim exists in effective permission set
6. Return boolean result (can/cannot perform resource operation)
```
*Used for: Project access, issue operations, comment management*

#### Role Examples by Type

**GlobalRoles**:
- **"Project Creator"**: Contains PROJECT_CREATE global permission

**ProjectRoles**:
- **"Project Owner"**: Contains all project/issue/comment/history claims
- **"Developer"**: Contains PROJECT_READ, ISSUE_*, COMMENT_READ/CREATE claims  
- **"Read Only"**: Contains PROJECT_READ, ISSUE_READ, COMMENT_READ claims

### Direct Sharing Implementation

**Permission Flow**: `User → Direct Permission Assignment → Access Decision`

#### Sharing Assignment Process
- **Direct Assignment**: Users or groups directly assigned VIEW/EDIT/ADMIN on specific tools
- **No Role Intermediation**: Permissions assigned directly without role collections
- **Ownership Model**: Creator typically gets ADMIN permission automatically

#### Permission Levels
- **VIEW**: Read-only access to tool content and configuration
- **EDIT**: Modify tool content, settings, and configuration
- **ADMIN**: Full control including permission management and deletion

#### Applicable Resources
Tools using direct sharing: Boards, Reports, Searches, Tags

### Custom Fields Permission Patterns

**Permission Flow**: `User → Project Permission Check → Field Operation → Cross-Project Validation (if needed)`

#### Field Lifecycle Management
Custom Fields operate as project-bound shared resources with the following lifecycle:

1. **Creation**: Requires any PROJECT_UPDATE permission to create field in global registry
2. **Binding**: Requires PROJECT_UPDATE on target project to bind field to project  
3. **Discovery**: Requires PROJECT_READ on project to view bound fields
4. **Definition Modification**: Requires PROJECT_UPDATE on ALL projects where field is bound
5. **Unbinding**: Requires PROJECT_UPDATE on project to remove field binding

#### Cross-Project Validation Logic
```
Field Definition Modification Process:
1. User attempts to edit custom field definition
2. System queries all projects where field is bound
3. For each bound project:
   - Check if user has PROJECT_UPDATE permission
   - Collect any failures
4. If ANY project lacks permission → Block operation with specific error
5. If ALL projects have permission → Allow modification
6. Admin override: Skip project validation if user.is_admin = true
```

## Use Cases & Examples

### Example 1: Project Creation with Global Role
```
User: Alice (has "Project Creator" global role)
Global Role Contents: [PROJECT_CREATE]
Action: Alice wants to create a new project "Website Redesign"
Process: 
  1. System checks: Alice.is_admin (false) OR PROJECT_CREATE in Alice.global_permissions (true)
  2. Permission check passes
  3. Project created successfully
  4. Alice automatically assigned "Project Owner" role on new project
Result: Alice can create projects without being a full system admin
```

### Example 2: Standard Project Access
```
User: Bob
Project: "Website Redesign"
Permissions: Bob is in "Design Team" group
Group Permission: "Design Team" has "Designer" project role
Role Contents: [PROJECT_READ, ISSUE_READ, ISSUE_CREATE, ISSUE_UPDATE, COMMENT_READ, COMMENT_CREATE]
Result: Bob can read project, create/update issues, read/create comments, and view custom fields bound to the project
```

### Example 3: Project Owner Role
```
User: Diana (Project Creator)
Project: "Mobile App Development"
Role Assignment: Diana has "Project Owner" role (auto-assigned at creation)
Role Contents: [
  PROJECT_READ, PROJECT_UPDATE, PROJECT_DELETE, PROJECT_MANAGE_PERMISSIONS,
  ISSUE_CREATE, ISSUE_READ, ISSUE_UPDATE, ISSUE_DELETE, ISSUE_MANAGE_PERMISSIONS,
  COMMENT_READ, COMMENT_CREATE, COMMENT_UPDATE, COMMENT_DELETE_OWN, COMMENT_DELETE, COMMENT_HIDE, COMMENT_RESTORE,
  HISTORY_HIDE, HISTORY_RESTORE
]
Actions: Diana can manage all aspects of the project - settings, permissions, issues, comments, history, and custom fields (create new fields, bind existing fields to project, edit field definitions)
Result: Diana has comprehensive control over her project through the predefined Project Owner role
```

### Example 4: Confidential Issue
```
User: Charlie (Project Manager with Project Owner role)
Issue: "Security Vulnerability #123"
Issue Settings: disable_project_permissions_inheritance = True
Issue Permissions: Charlie has "Security Manager" role on issue
Role Contents: [ISSUE_READ, ISSUE_UPDATE, ISSUE_MANAGE_PERMISSIONS]
Result: Only Charlie can access this issue, despite other team members having project access
```

### Example 5: External Stakeholder Access
```
User: Eve (External Consultant)
Project: "Website Redesign" (Eve has no project access)
Issue: "User Experience Review"
Issue Permission: Eve has "Consultant" role on specific issue
Role Contents: [ISSUE_READ, COMMENT_READ, COMMENT_CREATE]
Result: Eve can access only this specific issue and participate in discussions
```

### Example 6: Admin vs Non-Admin Operations
```
User: Frank (regular user with "Project Creator" global role)
Global Roles: "Project Creator" (contains PROJECT_CREATE)
Project Access: "Developer" role on "API Development" project (contains PROJECT_READ, ISSUE_*)
Capabilities:
  - Can create projects (PROJECT_CREATE global permission)
  - Can read/update issues in "API Development" project (project permission)
  - Can view custom fields bound to "API Development" project (PROJECT_READ)
  - Cannot create or bind custom fields (no PROJECT_UPDATE)
  - Cannot manage users (admin-only operation)
  - Cannot manage workflows (admin-only operation)
  - Cannot manage permissions in "API Development" (no PROJECT_MANAGE_PERMISSIONS)
Result: Can create projects but cannot perform system administration tasks or modify project configuration
```

### Example 7: Board Sharing (Tool System)
```
User: Grace (Project Manager)
Tool: "Sprint Planning" kanban board
Action: Grace creates board for her team
Direct Permissions: Grace gets ADMIN automatically as creator
Sharing: Grace gives VIEW to stakeholders, EDIT to team members
Benefit: Simple direct sharing without role complexity - perfect for tool ownership
Result: Team collaborates on board without needing project-level role management
```

### Example 8: Report Access Control (Tool System)
```
User: Henry (Data Analyst)
Tool: "Q4 Sales Dashboard" report
Direct Permissions: Henry has ADMIN (creator), Marketing Team has VIEW, Sales Managers have EDIT
Cross-Department Sharing: Finance Team gets VIEW without any project access
Benefit: Direct permission model enables flexible tool sharing across organizational boundaries
Result: Tool access management independent of project structures
```

### Example 9: Dual System Integration
```
Context: "Mobile App" project with associated planning tools
Collaborative System: Project uses roles (Developer, Designer, Project Owner) for issue management
Tool System: Planning board uses direct sharing (team has EDIT, stakeholders have VIEW)
User: Sarah (Developer role in project, EDIT permission on board)
Access Pattern: 
  - Project: Role-based collaborative permissions for complex issue workflows
  - Board: Direct sharing for simple tool ownership and access control
Benefit: Each system optimized for its use case - collaboration vs ownership
Result: Clear, efficient permission management matching complexity to requirements
```

### Example 10: Custom Field Creation and Binding
```
User: Maria (Project Manager)
Project: "E-commerce Platform"
Role: "Project Owner" (contains PROJECT_UPDATE)
Action: Maria wants to create a "Priority Level" enum field and bind it to her project
Process:
  1. Maria creates new enum custom field "Priority Level" (HIGH, MEDIUM, LOW)
  2. System checks: Maria has PROJECT_UPDATE on "E-commerce Platform" (true)
  3. Field created successfully in global field registry
  4. Maria binds field to "E-commerce Platform" project
  5. System checks: Maria has PROJECT_UPDATE on target project (true)
  6. Field bound successfully - now available for issues in this project
Result: Maria can create and bind custom fields to projects she manages, enabling project-specific issue categorization
```

### Example 11: Cross-Project Field Permission Validation
```
User: Alex (Lead Developer)
Projects: "Frontend App" (Project Owner), "Backend API" (Developer role - PROJECT_READ only)
Custom Field: "Release Version" enum field bound to both projects
Action: Alex wants to modify the "Release Version" field definition (add new version)
Process:
  1. Alex attempts to edit "Release Version" field definition
  2. System identifies field is bound to: "Frontend App", "Backend API"
  3. Permission check: Alex has PROJECT_UPDATE on "Frontend App" (true)
  4. Permission check: Alex has PROJECT_UPDATE on "Backend API" (false - only PROJECT_READ)
  5. System blocks the operation - insufficient permissions
Error: "Field modification requires PROJECT_UPDATE permission on all bound projects: Backend API"
Result: Cross-project validation prevents unauthorized field changes that could affect other teams
```

### Example 12: Admin Override for Field Management
```
User: Sarah (System Administrator, is_admin=true)
Projects: Multiple projects using "Department" field, Sarah has no direct project permissions
Custom Field: "Department" enum field bound to "HR System", "Finance Tools", "Marketing Hub"
Action: Sarah needs to add new department "Research & Development" to the enum
Process:
  1. Sarah attempts to edit "Department" field definition
  2. System identifies field is bound to 3 projects: HR System, Finance Tools, Marketing Hub
  3. Permission check: Sarah has PROJECT_UPDATE on projects (false - no direct project access)
  4. Admin override check: Sarah.is_admin (true) - bypass project-level validation
  5. Field modification allowed - "Research & Development" added to enum
Result: Admin can manage custom fields across all projects regardless of individual project permissions
Note: Admin override works for field management but still respects project boundaries for field discovery
```

