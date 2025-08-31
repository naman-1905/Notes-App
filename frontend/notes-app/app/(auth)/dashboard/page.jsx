"use client"
import React from 'react'
import ProfileInfo from '@/app/components/Cards/ProfileInfo'
import Navbar from '@/app/components/Navbar'

function Homepage() {
  return (
    <div>
      <ProfileInfo name="Jane Smith" onLogout={() => console.log("Logged out")} />
    </div>
  )
}

export default Homepage
