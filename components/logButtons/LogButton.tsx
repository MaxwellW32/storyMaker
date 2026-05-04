"use client"
import { useRouter } from 'next/navigation'
import React from 'react'

export default function LogButton({ option }: { option: "login" | "logout" }) {
  const router = useRouter()

  return (
    <button className='button1'
      onClick={() => {
        router.push(option === "login" ? "/api/auth/signin" : "/api/auth/signout")
      }}
    >
      {option === "login" ? "login" : "logout"}
    </button>
  )
}