"use client"

import Link from "next/link"

const LIBS = ["pandas", "sklearn", "oop", "sqlite3", "data-types","simple-apps","python-basics","beyin-firtinasi"]

export default function LibraryNav({ current }: { current: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
      {LIBS.map((lib) => {
        const isActive = lib === current.toLowerCase()
        return (
          <Link 
            key={lib} 
            href={`/interviews/${lib}`}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${isActive 
                ? "bg-indigo-500 text-white" 
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"}
            `}
          >
            {lib.charAt(0).toUpperCase() + lib.slice(1)}
          </Link>
        )
      })}
    </div>
  )
}