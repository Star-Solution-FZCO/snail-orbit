/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LoginImport } from './routes/login'
import { Route as AuthenticatedImport } from './routes/_authenticated'
import { Route as AuthenticatedRolesRoleIdImport } from './routes/_authenticated/roles/$roleId'
import { Route as AuthenticatedProjectsProjectIdImport } from './routes/_authenticated/projects/$projectId'
import { Route as AuthenticatedGroupsGroupIdImport } from './routes/_authenticated/groups/$groupId'
import { Route as AuthenticatedAgilesBoardIdImport } from './routes/_authenticated/agiles/$boardId'

// Create Virtual Routes

const AuthenticatedIndexLazyImport = createFileRoute('/_authenticated/')()
const AuthenticatedRolesIndexLazyImport = createFileRoute(
  '/_authenticated/roles/',
)()
const AuthenticatedProjectsIndexLazyImport = createFileRoute(
  '/_authenticated/projects/',
)()
const AuthenticatedIssuesIndexLazyImport = createFileRoute(
  '/_authenticated/issues/',
)()
const AuthenticatedGroupsIndexLazyImport = createFileRoute(
  '/_authenticated/groups/',
)()
const AuthenticatedCustomFieldsIndexLazyImport = createFileRoute(
  '/_authenticated/custom-fields/',
)()
const AuthenticatedAgilesIndexLazyImport = createFileRoute(
  '/_authenticated/agiles/',
)()
const AuthenticatedRolesCreateLazyImport = createFileRoute(
  '/_authenticated/roles/create',
)()
const AuthenticatedProjectsCreateLazyImport = createFileRoute(
  '/_authenticated/projects/create',
)()
const AuthenticatedIssuesCreateLazyImport = createFileRoute(
  '/_authenticated/issues/create',
)()
const AuthenticatedIssuesIssueIdLazyImport = createFileRoute(
  '/_authenticated/issues/$issueId',
)()
const AuthenticatedGroupsCreateLazyImport = createFileRoute(
  '/_authenticated/groups/create',
)()
const AuthenticatedDraftDraftIdLazyImport = createFileRoute(
  '/_authenticated/draft/$draftId',
)()
const AuthenticatedCustomFieldsCreateLazyImport = createFileRoute(
  '/_authenticated/custom-fields/create',
)()
const AuthenticatedCustomFieldsCustomFieldIdLazyImport = createFileRoute(
  '/_authenticated/custom-fields/$customFieldId',
)()
const AuthenticatedAgilesCreateLazyImport = createFileRoute(
  '/_authenticated/agiles/create',
)()
const AuthenticatedIssuesIssueIdSubjectLazyImport = createFileRoute(
  '/_authenticated/issues/$issueId/$subject',
)()

// Create/Update Routes

const LoginRoute = LoginImport.update({
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedRoute = AuthenticatedImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedIndexLazyRoute = AuthenticatedIndexLazyImport.update({
  path: '/',
  getParentRoute: () => AuthenticatedRoute,
} as any).lazy(() =>
  import('./routes/_authenticated/index.lazy').then((d) => d.Route),
)

const AuthenticatedRolesIndexLazyRoute =
  AuthenticatedRolesIndexLazyImport.update({
    path: '/roles/',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/roles/index.lazy').then((d) => d.Route),
  )

const AuthenticatedProjectsIndexLazyRoute =
  AuthenticatedProjectsIndexLazyImport.update({
    path: '/projects/',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/projects/index.lazy').then((d) => d.Route),
  )

const AuthenticatedIssuesIndexLazyRoute =
  AuthenticatedIssuesIndexLazyImport.update({
    path: '/issues/',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/issues/index.lazy').then((d) => d.Route),
  )

const AuthenticatedGroupsIndexLazyRoute =
  AuthenticatedGroupsIndexLazyImport.update({
    path: '/groups/',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/groups/index.lazy').then((d) => d.Route),
  )

const AuthenticatedCustomFieldsIndexLazyRoute =
  AuthenticatedCustomFieldsIndexLazyImport.update({
    path: '/custom-fields/',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/custom-fields/index.lazy').then(
      (d) => d.Route,
    ),
  )

const AuthenticatedAgilesIndexLazyRoute =
  AuthenticatedAgilesIndexLazyImport.update({
    path: '/agiles/',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/agiles/index.lazy').then((d) => d.Route),
  )

const AuthenticatedRolesCreateLazyRoute =
  AuthenticatedRolesCreateLazyImport.update({
    path: '/roles/create',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/roles/create.lazy').then((d) => d.Route),
  )

const AuthenticatedProjectsCreateLazyRoute =
  AuthenticatedProjectsCreateLazyImport.update({
    path: '/projects/create',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/projects/create.lazy').then((d) => d.Route),
  )

const AuthenticatedIssuesCreateLazyRoute =
  AuthenticatedIssuesCreateLazyImport.update({
    path: '/issues/create',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/issues/create.lazy').then((d) => d.Route),
  )

const AuthenticatedIssuesIssueIdLazyRoute =
  AuthenticatedIssuesIssueIdLazyImport.update({
    path: '/issues/$issueId',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/issues/$issueId.lazy').then((d) => d.Route),
  )

const AuthenticatedGroupsCreateLazyRoute =
  AuthenticatedGroupsCreateLazyImport.update({
    path: '/groups/create',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/groups/create.lazy').then((d) => d.Route),
  )

const AuthenticatedDraftDraftIdLazyRoute =
  AuthenticatedDraftDraftIdLazyImport.update({
    path: '/draft/$draftId',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/draft/$draftId.lazy').then((d) => d.Route),
  )

const AuthenticatedCustomFieldsCreateLazyRoute =
  AuthenticatedCustomFieldsCreateLazyImport.update({
    path: '/custom-fields/create',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/custom-fields/create.lazy').then(
      (d) => d.Route,
    ),
  )

const AuthenticatedCustomFieldsCustomFieldIdLazyRoute =
  AuthenticatedCustomFieldsCustomFieldIdLazyImport.update({
    path: '/custom-fields/$customFieldId',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/custom-fields/$customFieldId.lazy').then(
      (d) => d.Route,
    ),
  )

const AuthenticatedAgilesCreateLazyRoute =
  AuthenticatedAgilesCreateLazyImport.update({
    path: '/agiles/create',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/agiles/create.lazy').then((d) => d.Route),
  )

const AuthenticatedRolesRoleIdRoute = AuthenticatedRolesRoleIdImport.update({
  path: '/roles/$roleId',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedProjectsProjectIdRoute =
  AuthenticatedProjectsProjectIdImport.update({
    path: '/projects/$projectId',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedGroupsGroupIdRoute = AuthenticatedGroupsGroupIdImport.update(
  {
    path: '/groups/$groupId',
    getParentRoute: () => AuthenticatedRoute,
  } as any,
)

const AuthenticatedAgilesBoardIdRoute = AuthenticatedAgilesBoardIdImport.update(
  {
    path: '/agiles/$boardId',
    getParentRoute: () => AuthenticatedRoute,
  } as any,
)

const AuthenticatedIssuesIssueIdSubjectLazyRoute =
  AuthenticatedIssuesIssueIdSubjectLazyImport.update({
    path: '/$subject',
    getParentRoute: () => AuthenticatedIssuesIssueIdLazyRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/issues/$issueId.$subject.lazy').then(
      (d) => d.Route,
    ),
  )

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedImport
      parentRoute: typeof rootRoute
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated/': {
      id: '/_authenticated/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof AuthenticatedIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/agiles/$boardId': {
      id: '/_authenticated/agiles/$boardId'
      path: '/agiles/$boardId'
      fullPath: '/agiles/$boardId'
      preLoaderRoute: typeof AuthenticatedAgilesBoardIdImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/groups/$groupId': {
      id: '/_authenticated/groups/$groupId'
      path: '/groups/$groupId'
      fullPath: '/groups/$groupId'
      preLoaderRoute: typeof AuthenticatedGroupsGroupIdImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/projects/$projectId': {
      id: '/_authenticated/projects/$projectId'
      path: '/projects/$projectId'
      fullPath: '/projects/$projectId'
      preLoaderRoute: typeof AuthenticatedProjectsProjectIdImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/roles/$roleId': {
      id: '/_authenticated/roles/$roleId'
      path: '/roles/$roleId'
      fullPath: '/roles/$roleId'
      preLoaderRoute: typeof AuthenticatedRolesRoleIdImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/agiles/create': {
      id: '/_authenticated/agiles/create'
      path: '/agiles/create'
      fullPath: '/agiles/create'
      preLoaderRoute: typeof AuthenticatedAgilesCreateLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/custom-fields/$customFieldId': {
      id: '/_authenticated/custom-fields/$customFieldId'
      path: '/custom-fields/$customFieldId'
      fullPath: '/custom-fields/$customFieldId'
      preLoaderRoute: typeof AuthenticatedCustomFieldsCustomFieldIdLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/custom-fields/create': {
      id: '/_authenticated/custom-fields/create'
      path: '/custom-fields/create'
      fullPath: '/custom-fields/create'
      preLoaderRoute: typeof AuthenticatedCustomFieldsCreateLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/draft/$draftId': {
      id: '/_authenticated/draft/$draftId'
      path: '/draft/$draftId'
      fullPath: '/draft/$draftId'
      preLoaderRoute: typeof AuthenticatedDraftDraftIdLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/groups/create': {
      id: '/_authenticated/groups/create'
      path: '/groups/create'
      fullPath: '/groups/create'
      preLoaderRoute: typeof AuthenticatedGroupsCreateLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/issues/$issueId': {
      id: '/_authenticated/issues/$issueId'
      path: '/issues/$issueId'
      fullPath: '/issues/$issueId'
      preLoaderRoute: typeof AuthenticatedIssuesIssueIdLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/issues/create': {
      id: '/_authenticated/issues/create'
      path: '/issues/create'
      fullPath: '/issues/create'
      preLoaderRoute: typeof AuthenticatedIssuesCreateLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/projects/create': {
      id: '/_authenticated/projects/create'
      path: '/projects/create'
      fullPath: '/projects/create'
      preLoaderRoute: typeof AuthenticatedProjectsCreateLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/roles/create': {
      id: '/_authenticated/roles/create'
      path: '/roles/create'
      fullPath: '/roles/create'
      preLoaderRoute: typeof AuthenticatedRolesCreateLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/agiles/': {
      id: '/_authenticated/agiles/'
      path: '/agiles'
      fullPath: '/agiles'
      preLoaderRoute: typeof AuthenticatedAgilesIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/custom-fields/': {
      id: '/_authenticated/custom-fields/'
      path: '/custom-fields'
      fullPath: '/custom-fields'
      preLoaderRoute: typeof AuthenticatedCustomFieldsIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/groups/': {
      id: '/_authenticated/groups/'
      path: '/groups'
      fullPath: '/groups'
      preLoaderRoute: typeof AuthenticatedGroupsIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/issues/': {
      id: '/_authenticated/issues/'
      path: '/issues'
      fullPath: '/issues'
      preLoaderRoute: typeof AuthenticatedIssuesIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/projects/': {
      id: '/_authenticated/projects/'
      path: '/projects'
      fullPath: '/projects'
      preLoaderRoute: typeof AuthenticatedProjectsIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/roles/': {
      id: '/_authenticated/roles/'
      path: '/roles'
      fullPath: '/roles'
      preLoaderRoute: typeof AuthenticatedRolesIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/issues/$issueId/$subject': {
      id: '/_authenticated/issues/$issueId/$subject'
      path: '/$subject'
      fullPath: '/issues/$issueId/$subject'
      preLoaderRoute: typeof AuthenticatedIssuesIssueIdSubjectLazyImport
      parentRoute: typeof AuthenticatedIssuesIssueIdLazyImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  AuthenticatedRoute: AuthenticatedRoute.addChildren({
    AuthenticatedIndexLazyRoute,
    AuthenticatedAgilesBoardIdRoute,
    AuthenticatedGroupsGroupIdRoute,
    AuthenticatedProjectsProjectIdRoute,
    AuthenticatedRolesRoleIdRoute,
    AuthenticatedAgilesCreateLazyRoute,
    AuthenticatedCustomFieldsCustomFieldIdLazyRoute,
    AuthenticatedCustomFieldsCreateLazyRoute,
    AuthenticatedDraftDraftIdLazyRoute,
    AuthenticatedGroupsCreateLazyRoute,
    AuthenticatedIssuesIssueIdLazyRoute:
      AuthenticatedIssuesIssueIdLazyRoute.addChildren({
        AuthenticatedIssuesIssueIdSubjectLazyRoute,
      }),
    AuthenticatedIssuesCreateLazyRoute,
    AuthenticatedProjectsCreateLazyRoute,
    AuthenticatedRolesCreateLazyRoute,
    AuthenticatedAgilesIndexLazyRoute,
    AuthenticatedCustomFieldsIndexLazyRoute,
    AuthenticatedGroupsIndexLazyRoute,
    AuthenticatedIssuesIndexLazyRoute,
    AuthenticatedProjectsIndexLazyRoute,
    AuthenticatedRolesIndexLazyRoute,
  }),
  LoginRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_authenticated",
        "/login"
      ]
    },
    "/_authenticated": {
      "filePath": "_authenticated.tsx",
      "children": [
        "/_authenticated/",
        "/_authenticated/agiles/$boardId",
        "/_authenticated/groups/$groupId",
        "/_authenticated/projects/$projectId",
        "/_authenticated/roles/$roleId",
        "/_authenticated/agiles/create",
        "/_authenticated/custom-fields/$customFieldId",
        "/_authenticated/custom-fields/create",
        "/_authenticated/draft/$draftId",
        "/_authenticated/groups/create",
        "/_authenticated/issues/$issueId",
        "/_authenticated/issues/create",
        "/_authenticated/projects/create",
        "/_authenticated/roles/create",
        "/_authenticated/agiles/",
        "/_authenticated/custom-fields/",
        "/_authenticated/groups/",
        "/_authenticated/issues/",
        "/_authenticated/projects/",
        "/_authenticated/roles/"
      ]
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/_authenticated/": {
      "filePath": "_authenticated/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/agiles/$boardId": {
      "filePath": "_authenticated/agiles/$boardId.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/groups/$groupId": {
      "filePath": "_authenticated/groups/$groupId.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/projects/$projectId": {
      "filePath": "_authenticated/projects/$projectId.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/roles/$roleId": {
      "filePath": "_authenticated/roles/$roleId.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/agiles/create": {
      "filePath": "_authenticated/agiles/create.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/custom-fields/$customFieldId": {
      "filePath": "_authenticated/custom-fields/$customFieldId.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/custom-fields/create": {
      "filePath": "_authenticated/custom-fields/create.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/draft/$draftId": {
      "filePath": "_authenticated/draft/$draftId.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/groups/create": {
      "filePath": "_authenticated/groups/create.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/issues/$issueId": {
      "filePath": "_authenticated/issues/$issueId.lazy.tsx",
      "parent": "/_authenticated",
      "children": [
        "/_authenticated/issues/$issueId/$subject"
      ]
    },
    "/_authenticated/issues/create": {
      "filePath": "_authenticated/issues/create.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/projects/create": {
      "filePath": "_authenticated/projects/create.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/roles/create": {
      "filePath": "_authenticated/roles/create.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/agiles/": {
      "filePath": "_authenticated/agiles/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/custom-fields/": {
      "filePath": "_authenticated/custom-fields/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/groups/": {
      "filePath": "_authenticated/groups/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/issues/": {
      "filePath": "_authenticated/issues/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/projects/": {
      "filePath": "_authenticated/projects/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/roles/": {
      "filePath": "_authenticated/roles/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/issues/$issueId/$subject": {
      "filePath": "_authenticated/issues/$issueId.$subject.lazy.tsx",
      "parent": "/_authenticated/issues/$issueId"
    }
  }
}
ROUTE_MANIFEST_END */
