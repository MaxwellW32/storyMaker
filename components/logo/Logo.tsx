import Image from 'next/image'
import React from 'react'
import logo from "@/public/logo.png"
import Link from 'next/link'

export default function Logo() {
    return (
        <Link href={"/"}>
            <Image alt='logo' src={logo} width={50} height={50} style={{ objectFit: "contain" }} />
        </Link>
    )
}