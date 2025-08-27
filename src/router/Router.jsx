import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router";
import Login from "../auth/Login";
import Register from "../auth/Register";
import Folders from "../Pages/Folders";
import Document from "../Pages/Document";
import PublicPreview from "../Pages/PublicPreview";
import SearchPage from "../Pages/Search";

function ProtectedLayout() {
  const isAuthed =
    typeof window !== "undefined" && !!localStorage.getItem("accessToken");
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  // Protected app routes
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/", element: <Navigate to="/folders/root" replace /> },
      { path: "/folders/:id", element: <Folders /> },
      { path: "/documents/:id", element: <Document /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/*", element: <Navigate to="/folders/root" replace /> },
    ],
  },
  // Public auth routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  // Public share preview
  { path: "/public/:token", element: <PublicPreview /> },
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
