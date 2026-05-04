import React, { HTMLAttributes } from 'react'
import LogButton from '../logButtons/LogButton'
import styles from "./style.module.css"
import Link from 'next/link'
import Logo from "@/components/logo/Logo"
import Image from 'next/image'
import defaultImage from "@/public/logo.png"
import { auth } from '@/auth/auth'

type menuItem = {
    title: string,
    link: string,
    subMenu?: subMenuItem[]
}

type subMenuItem = {
    title: string,
    link: string,
    subSubMenu?: subSubMenuItem[]
}

type subSubMenuItem = {
    title: string,
    link: string
}

export default async function Navbar({ menuInfoArr }: { menuInfoArr: menuItem[] }) {
    const session = await auth()

    return (
        <nav id='mainNav' className={styles.mainNav}>
            <MobileNav menuItems={menuInfoArr} />

            <Logo />

            <DesktopNav menuItems={menuInfoArr} />

            <div style={{ justifySelf: "flex-end", display: "grid", alignContent: "flex-start" }}>
                {session === null ? (
                    <LogButton option='login' />
                ) : (
                    <div className={styles.contDiv}>
                        <label htmlFor='userOptionsCheckbox' style={{ margin: "0 auto", cursor: "pointer" }}>
                            <Image alt="userImage" src={session.user.image !== null ? session.user.image : defaultImage} width={30} height={30} style={{ objectFit: "cover" }}
                            />
                        </label>

                        <input id='userOptionsCheckbox' className="visibilityCheckbox" type="checkbox" />

                        <ul className={styles.moreItemsMenu}>
                            <li style={{ padding: ".5rem" }}>{session.user.name}</li>

                            <li className={styles.moreIntemsItem}>account</li>

                            <li className={styles.moreIntemsItem}>settings</li>

                            <li className={styles.moreIntemsItem}>
                                <LogButton option='logout' />
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    )
}

function DesktopNav({ menuItems }: { menuItems: menuItem[] }) {

    return (
        <Menu menu={menuItems} className={styles.desktopMenu} />
    )
}

function MobileNav({ menuItems }: { menuItems: menuItem[] }) {

    return (
        <div className={styles.mobileMenu}>
            <label htmlFor='mobileMenuCheckbox' style={{ margin: "0 auto", cursor: "pointer" }}>
                <svg style={{ width: "var(--sizeEL)" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" /></svg>
            </label>

            {/* use checkbox styling to hide the menu */}
            <input id='mobileMenuCheckbox' className="visibilityCheckbox" type="checkbox" />
            <Menu menu={menuItems} />
        </div>
    )
}

function Menu({ menu, ...elProps }: { menu: menuItem[] } & HTMLAttributes<HTMLUListElement>) {
    const pathname = ""

    return (
        <ul {...elProps} className={`${styles.mainMenu} noScrollBar ${elProps.className ?? ""}`}>
            {menu.map((eachMenuItem, eachMenuItemIndex) => (
                <li key={eachMenuItemIndex} className={styles.mainMenuItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacingES)", justifyContent: "space-between", padding: "vaR(--spacingR)" }}>
                        <Link style={{ color: pathname === eachMenuItem.link ? "var(--color1)" : "" }} href={eachMenuItem.link}>{eachMenuItem.title}</Link>

                        {eachMenuItem.subMenu !== undefined && (
                            <label htmlFor='menuItemCheckbox'>
                                <svg style={{ width: "var(--sizeS)", fill: pathname === eachMenuItem.link ? "var(--color1)" : "" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                            </label>
                        )}
                    </div>

                    {eachMenuItem.subMenu !== undefined && eachMenuItem.subMenu.length > 0 && (
                        <>
                            <input id='menuItemCheckbox' className="visibilityCheckbox" type="checkbox" />
                            <SubMenu subMenu={eachMenuItem.subMenu} />
                        </>
                    )}
                </li>
            ))}
        </ul>
    )
}

function SubMenu({ subMenu }: { subMenu: subMenuItem[] }) {
    const pathname = ""

    return (
        <ul className={styles.subMenu}>
            {subMenu.map((eachSubMenuItem, eachSubMenuItemIndex) => (
                <li key={eachSubMenuItemIndex} className={styles.subMenuItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacingES)", justifyContent: "space-between" }}>
                        <Link style={{ color: pathname === eachSubMenuItem.link ? "var(--color1)" : "" }} href={eachSubMenuItem.link}>{eachSubMenuItem.title}</Link>

                        {eachSubMenuItem.subSubMenu !== undefined && (
                            <label htmlFor='subMenuItemCheckbox'>
                                <svg style={{ width: "var(--sizeS)", color: pathname === eachSubMenuItem.link ? "var(--color1)" : "" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                            </label>
                        )}
                    </div>

                    {eachSubMenuItem.subSubMenu !== undefined && eachSubMenuItem.subSubMenu.length > 0 && (
                        <>
                            <input id='subMenuItemCheckbox' className="visibilityCheckbox" type="checkbox" />
                            <SubSubMenu subSubMenu={eachSubMenuItem.subSubMenu} />
                        </>
                    )}
                </li>
            ))}
        </ul>
    )
}

function SubSubMenu({ subSubMenu }: { subSubMenu: subSubMenuItem[] }) {
    const pathname = ""

    return (
        <ul className={styles.subSubMenu}>
            {subSubMenu.map((seenSubSubMenuItem, seenSubSubMenuItemIndex) => (
                <li key={seenSubSubMenuItemIndex} style={{ color: pathname === seenSubSubMenuItem.link ? "var(--color1)" : "" }} className={styles.subSubMenuItem}><Link href={seenSubSubMenuItem.link}>{seenSubSubMenuItem.title}</Link></li>
            ))}
        </ul>
    )
}
