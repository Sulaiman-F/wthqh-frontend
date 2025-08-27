import { useNavigate, Link } from "react-router";
import { useState } from "react";
import { UserCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { authAPI } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user.name) return toast.error("Please fill in Name field");
    if (!user.email) return toast.error("Please fill in Email field");
    if (!user.password) return toast.error("Please fill in Password field");
    if (!user.confirmPassword)
      return toast.error("Please fill in Confirm Password field");
    if (user.password !== user.confirmPassword)
      return toast.error("Passwords do not match");
    if (user.password.length < 6)
      return toast.error("Password must be at least 6 characters long");
    if (!/\S+@\S+\.\S+/.test(user.email))
      return toast.error("Please enter a valid email address");

    setLoading(true);

    try {
      const data = await authAPI.signup(user.name, user.email, user.password);
      if (data?.accessToken) {
        toast.success("Registration successful! Please login.");
        navigate("/login", { replace: true });
      } else {
        toast.error(data?.message || "Registration failed");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Registration failed";
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
            Create an account to access your documents.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center bg-neutral-100 h-full w-1/2">
          <div className="flex flex-col items-center  p-5 gap-5 md:px-10 shadow-md rounded-lg bg-neutral-150">
            <div className="flex flex-col items-center bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full">
              <UserCircle className="text-neutral-50" size={64} />
            </div>
            <h1 className="text-xl font-medium">Register</h1>{" "}
            <form
              className="flex flex-col items-center gap-3"
              onSubmit={handleSubmit}
            >
              <input
                className="border border-gray-300/50 p-2 px-5 rounded-lg w-72 focus:outline-2 focus:outline-cyan-600/50 hover:shadow-md transition-shadow duration-300 shadow-cyan-500/20 hover:border-cyan-600/50  focus:bg-neutral-200/50"
                type="text"
                name="name"
                placeholder="Enter name"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
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
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              </div>
              <div className="relative w-72">
                <input
                  className="border border-gray-300/50 p-2 px-5 rounded-lg w-full focus:outline-2 focus:outline-cyan-600/50 hover:shadow-md transition-shadow duration-300 shadow-cyan-500/20 hover:border-cyan-600/50  focus:bg-neutral-200/50"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Confirm password"
                  value={user.confirmPassword}
                  onChange={(e) =>
                    setUser({
                      ...user,
                      confirmPassword: e.target.value,
                    })
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
              <p className="text-sm text-gray-500">
                already have an account?{" "}
                <Link
                  className="hover:underline cursor-pointer hover:text-cyan-500"
                  to="/login"
                >
                  Login
                </Link>
              </p>{" "}
              <button
                className="bg-blue-400 text-white p-2 rounded-lg w-40 hover:bg-blue-500 transition-colors duration-300 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
