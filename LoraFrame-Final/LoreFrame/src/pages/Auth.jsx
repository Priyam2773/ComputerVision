import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Cpu, LogIn, UserPlus } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    try {
      if (mode === "login") {
        console.log("LOGIN:", data);
        toast.success("Login successful");
      } else {
        console.log("SIGNUP:", data);
        toast.success("Account created successfully");
      }
      reset();
    } catch (err) {
      toast.error("Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 transition-all">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <Cpu className="text-blue-500" size={32} />
          </div>
          <h1 className="text-xl font-bold text-white">
            {mode === "login" ? "Neural Studio Login" : "Create Neural Identity"}
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
            {mode === "login" ? "Secure Access Node" : "Studio Registration"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Email */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Email
            </label>
            <input
              {...register("email", { required: true })}
              type="email"
              className="w-full mt-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">Email required</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Password
            </label>
            <input
              {...register("password", { required: true, minLength: 6 })}
              type="password"
              className="w-full mt-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">
                Password must be 6+ chars
              </p>
            )}
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === "signup" && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Confirm Password
              </label>
              <input
                {...register("confirmPassword", {
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
                type="password"
                className="w-full mt-1 bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-xs text-slate-500 mt-6">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <span
                onClick={() => {
                  reset();
                  setMode("signup");
                }}
                className="text-blue-400 cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                onClick={() => {
                  reset();
                  setMode("login");
                }}
                className="text-blue-400 cursor-pointer hover:underline"
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
