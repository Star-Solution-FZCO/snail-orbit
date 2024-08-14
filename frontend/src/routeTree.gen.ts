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
import { Route as AuthenticatedProjectsProjectIdImport } from './routes/_authenticated/projects/$projectId'
import { Route as AuthenticatedIssuesIssueIdImport } from './routes/_authenticated/issues/$issueId'

// Create Virtual Routes

const AuthenticatedIndexLazyImport = createFileRoute('/_authenticated/')()
const AuthenticatedProjectsIndexLazyImport = createFileRoute(
  '/_authenticated/projects/',
)()
const AuthenticatedIssuesIndexLazyImport = createFileRoute(
  '/_authenticated/issues/',
)()
const AuthenticatedCustomFieldsIndexLazyImport = createFileRoute(
  '/_authenticated/custom-fields/',
)()
const AuthenticatedAgilesIndexLazyImport = createFileRoute(
  '/_authenticated/agiles/',
)()
const AuthenticatedProjectsCreateLazyImport = createFileRoute(
  '/_authenticated/projects/create',
)()
const AuthenticatedIssuesCreateLazyImport = createFileRoute(
  '/_authenticated/issues/create',
)()
const AuthenticatedCustomFieldsCreateLazyImport = createFileRoute(
  '/_authenticated/custom-fields/create',
)()
const AuthenticatedCustomFieldsCustomFieldIdLazyImport = createFileRoute(
  '/_authenticated/custom-fields/$customFieldId',
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

const AuthenticatedProjectsProjectIdRoute =
  AuthenticatedProjectsProjectIdImport.update({
    path: '/projects/$projectId',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedIssuesIssueIdRoute = AuthenticatedIssuesIssueIdImport.update(
  {
    path: '/issues/$issueId',
    getParentRoute: () => AuthenticatedRoute,
  } as any,
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
    '/_authenticated/issues/$issueId': {
      id: '/_authenticated/issues/$issueId'
      path: '/issues/$issueId'
      fullPath: '/issues/$issueId'
      preLoaderRoute: typeof AuthenticatedIssuesIssueIdImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/projects/$projectId': {
      id: '/_authenticated/projects/$projectId'
      path: '/projects/$projectId'
      fullPath: '/projects/$projectId'
      preLoaderRoute: typeof AuthenticatedProjectsProjectIdImport
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
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  AuthenticatedRoute: AuthenticatedRoute.addChildren({
    AuthenticatedIndexLazyRoute,
    AuthenticatedIssuesIssueIdRoute,
    AuthenticatedProjectsProjectIdRoute,
    AuthenticatedCustomFieldsCustomFieldIdLazyRoute,
    AuthenticatedCustomFieldsCreateLazyRoute,
    AuthenticatedIssuesCreateLazyRoute,
    AuthenticatedProjectsCreateLazyRoute,
    AuthenticatedAgilesIndexLazyRoute,
    AuthenticatedCustomFieldsIndexLazyRoute,
    AuthenticatedIssuesIndexLazyRoute,
    AuthenticatedProjectsIndexLazyRoute,
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
        "/_authenticated/issues/$issueId",
        "/_authenticated/projects/$projectId",
        "/_authenticated/custom-fields/$customFieldId",
        "/_authenticated/custom-fields/create",
        "/_authenticated/issues/create",
        "/_authenticated/projects/create",
        "/_authenticated/agiles/",
        "/_authenticated/custom-fields/",
        "/_authenticated/issues/",
        "/_authenticated/projects/"
      ]
    },
    "/login": {
      "filePath": "login.tsx"
    },
    "/_authenticated/": {
      "filePath": "_authenticated/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/issues/$issueId": {
      "filePath": "_authenticated/issues/$issueId.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/projects/$projectId": {
      "filePath": "_authenticated/projects/$projectId.tsx",
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
    "/_authenticated/issues/create": {
      "filePath": "_authenticated/issues/create.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/projects/create": {
      "filePath": "_authenticated/projects/create.lazy.tsx",
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
    "/_authenticated/issues/": {
      "filePath": "_authenticated/issues/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/projects/": {
      "filePath": "_authenticated/projects/index.lazy.tsx",
      "parent": "/_authenticated"
    }
  }
}
ROUTE_MANIFEST_END */
