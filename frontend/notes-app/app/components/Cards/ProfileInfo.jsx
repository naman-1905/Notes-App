import React from "react";

function ProfileInfo({ name = "John Doe", onLogout }) {
  // Generate initials from name
  const getInitials = (fullName) => {
    const names = fullName.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-white">
      {/* Initials Avatar */}
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold">
        {getInitials(name)}
      </div>

      {/* Name */}
      <span className="font-medium text-gray-800">{name}</span>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="ml-auto px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition"
      >
        Logout
      </button>
    </div>
  );
}

export default ProfileInfo;
