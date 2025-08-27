import React from "react";
import { useNavigate, Link } from "react-router";
import { useState } from "react";
import { UserCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { authAPI } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email) {
      toast.error("Please fill in Email field");
      return;
    }
    if (!user.password) {
      toast.error("Please fill in Password field");
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.signin(user.email, user.password);
      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(data.user || {}));
        toast.success("Login successful!");
        navigate("/", { replace: true });
      } else {
        toast.error(data?.message || "Login failed");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-center h-screen bg-gray-100">
        <div className="hidden md:flex flex-col gap-y-5 items-center justify-center bg-gradient-to-bl from-cyan-400 to-blue-600 text-white h-full w-1/2 rounded-r-4xl">
          <h1 className="text-2xl">Welcome</h1>
          <p className="text-center text-lg w-3/4">
            Welcome back! Please log in to continue.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center bg-neutral-100 h-full w-1/2">
          <div className="flex flex-col items-center bg-neutral-150 p-5 gap-5 md:px-10 rounded-lg shadow-md">
            <div className="flex flex-col items-center bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full">
              <UserCircle className="text-neutral-50" size={64} />
            </div>
            <h1 className="text-xl font-medium">Login</h1>

            <form
              className="flex flex-col items-center gap-3"
              onSubmit={handleSubmit}
            >
              <input
                className="border border-gray-300/50 p-2 px-5 rounded-lg w-72 focus:outline-2 focus:outline-cyan-600/50 hover:shadow-md transition-shadow duration-300 shadow-cyan-500/20 hover:border-cyan-600/50  focus:bg-neutral-200/50"
                type="email"
                name="email"
                placeholder="Enter email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
              <div className="relative w-72">
                <input
                  className="border border-gray-300/50 p-2 px-5 rounded-lg w-full focus:outline-2 focus:outline-cyan-600/50 hover:shadow-md transition-shadow duration-300 shadow-cyan-500/20 hover:border-cyan-600/50  focus:bg-neutral-200/50"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={user.password}
                  onChange={(e) =>
                    setUser({ ...user, password: e.target.value })
                  }
                />

                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500 cursor-pointer hover:scale-110 transition-transform duration-200"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={22} /> : <EyeOff size={22} />}
                </button>
              </div>
              <p>
                Don't have an account?{" "}
                <Link
                  className="hover:underline cursor-pointer hover:text-cyan-500"
                  to="/register"
                >
                  Register
                </Link>
              </p>

              <button
                className="bg-blue-400 text-white p-2 rounded-lg w-40 hover:bg-blue-500 transition-colors duration-300 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Login ..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
