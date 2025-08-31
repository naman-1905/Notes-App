"use client";
import React from "react";
import { useRouter } from "next/navigation";

function ProfileInfo({ name = "John Doe" }) {
  const router = useRouter();

  // Generate initials from name
  const getInitials = (fullName) => {
    const names = fullName.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    // Clear cookies (basic client-side)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Redirect to login page
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-white shadow-md">
      {/* Initials Avatar */}
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold">
        {getInitials(name)}
      </div>

      {/* Name */}
      <span className="font-medium text-gray-800">{name}</span>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="ml-auto px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition"
      >
        Logout
      </button>
    </div>
  );
}

export default ProfileInfo;
