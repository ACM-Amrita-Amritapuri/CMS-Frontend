import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { AccountLayout } from "./layouts/AccountLayout";
import { AppLayout } from "./layouts/AppLayout";

const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) =>
  () => load().then(({ default: Component }) => ({ Component }));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    HydrateFallback: RouterFallback,
    children: [
      { path: "/", lazy: lazyPage(() => import("../pages/HomePage")) },
      { path: "/login", lazy: lazyPage(() => import("../pages/LoginPage")) },
      {
        element: <AccountLayout />,
        children: [
          {
            path: "/change-password",
            lazy: lazyPage(() => import("../pages/ChangePasswordPage")),
          },
          {
            path: "/profile/setup",
            lazy: lazyPage(() => import("../pages/ProfileSetupPage")),
          },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          {
            path: "/dashboard",
            lazy: lazyPage(() => import("../pages/dashboard/DashboardPage")),
          },
          {
            path: "/hackathons",
            lazy: lazyPage(() => import("../pages/HackathonsPage")),
          },
          {
            path: "/profile",
            lazy: lazyPage(() => import("../pages/profile/ProfilePage")),
          },
          {
            path: "/members",
            lazy: lazyPage(() => import("../pages/members/MembersPage")),
          },
          {
            path: "/members/:rollNumber",
            lazy: lazyPage(() => import("../pages/members/MemberDetailPage")),
          },
          {
            path: "/portfolio/:userId",
            lazy: lazyPage(() => import("../pages/portfolio/PortfolioPage")),
          },
          {
            path: "/learning",
            lazy: lazyPage(() => import("../pages/learning/LearningListPage")),
          },
          {
            path: "/learning/paths/:pathId",
            lazy: lazyPage(() => import("../pages/learning/LearningPathPage")),
          },
          {
            path: "/documentation",
            lazy: lazyPage(() =>
              import("../pages/documentation/DocumentationListPage"),
            ),
          },
          {
            path: "/documentation/:documentId",
            lazy: lazyPage(() =>
              import("../pages/documentation/DocumentDetailPage"),
            ),
          },
          {
            path: "/projects",
            lazy: lazyPage(() => import("../pages/projects/ProjectsListPage")),
          },
          {
            path: "/projects/:projectId",
            lazy: lazyPage(() =>
              import("../pages/projects/ProjectDetailPage"),
            ),
          },
          {
            path: "/operations",
            lazy: lazyPage(() => import("../pages/operations/OperationsPage")),
          },
          {
            path: "/operations/events/:eventId",
            lazy: lazyPage(() =>
              import("../pages/operations/EventDetailPage"),
            ),
          },
          {
            path: "/operations/calendar",
            lazy: lazyPage(() => import("../pages/operations/CalendarPage")),
          },
          {
            path: "/admin",
            lazy: lazyPage(() => import("../pages/admin/AdminDashboardPage")),
          },
          {
            path: "/admin/sigs",
            lazy: lazyPage(() => import("../pages/admin/AdminSigsPage")),
          },
          {
            path: "/admin/members",
            lazy: lazyPage(() => import("../pages/admin/AdminMembersPage")),
          },
          {
            path: "/admin/accounts",
            lazy: lazyPage(() => import("../pages/admin/AdminAccountsPage")),
          },
        ],
      },
      { path: "*", lazy: lazyPage(() => import("../pages/NotFoundPage")) },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});

function RouterFallback() {
  return <div className="min-h-svh" />;
}
