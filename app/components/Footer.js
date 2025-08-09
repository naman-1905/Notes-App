import React from 'react'

function Footer() {
  return (
    <div className="flex flex-col h-full px-4 py-4 text-center text-sm text-gray-200">
      Copyright © {new Date().getFullYear()} Naman Chaturvedi. All rights reserved.
    </div>
  )
}

export default Footer
