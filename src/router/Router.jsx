import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import Home from "../Pages/Home";
function Layout() {
  return (
    <>
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [{ index: true, element: <Home /> }],
  },
]);
function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
