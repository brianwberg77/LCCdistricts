'use client'

import { useState } from 'react'
import AuthNav from './AuthNav'
import AdminNav from './AdminNav'

export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative md:hidden">
      {/* Hamburger button */}
      <button
        aria-label="Open menu"
        onClick={() => setOpen(!open)}
        className="p-2 rounded border border-gray-300"
      >
        ☰
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50">
          <nav className="flex flex-col gap-2 p-3 text-sm">
            {isAdmin && <AdminNav />}
            <AuthNav />
          </nav>
        </div>
      )}
    </div>
  )
}