"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
    const [isDragging, setIsDragging] = useState(false)

    // Determine which corner we are closest to
    const [corner, setCorner] = useState('bottom-right') // top-left, top-right, bottom-left, bottom-right

    const menuRef = useRef(null)
    const buttonRef = useRef(null)
    const dragInfo = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false })

    // Initialize position and handle window resize
    useEffect(() => {
        const handleResize = () => {
            snapToCorner(position.x, position.y)
        }

        // Initial snap to bottom right on mount
        snapToCorner(window.innerWidth, window.innerHeight)

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const snapToCorner = (currentX, currentY) => {
        const { innerWidth, innerHeight } = window
        const margin = 24 // 1.5rem margin from edge

        const isLeft = currentX < innerWidth / 2
        const isTop = currentY < innerHeight / 2

        let newX = isLeft ? margin : innerWidth - margin - 48 // 48 is button width
        let newY = isTop ? margin : innerHeight - margin - 48 // 48 is button height

        const newCorner = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}`

        // Batch updates to avoid visual tearing
        setPosition({ x: newX, y: newY })
        setCorner(newCorner)
    }

    const handleMouseDown = (e) => {
        // Only accept left clicks
        if (e.button !== 0) return

        setIsDragging(true)
        dragInfo.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
            hasMoved: false
        }

        document.body.style.userSelect = 'none'
    }

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return

        const dx = e.clientX - dragInfo.current.startX
        const dy = e.clientY - dragInfo.current.startY

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragInfo.current.hasMoved = true
            // If we start dragging, close the menu automatically
            if (isOpen) setIsOpen(false)
        }

        const newX = dragInfo.current.initialX + dx
        const newY = dragInfo.current.initialY + dy

        // Constrain to window bounds
        const boundedX = Math.max(0, Math.min(window.innerWidth - 48, newX))
        const boundedY = Math.max(0, Math.min(window.innerHeight - 48, newY))

        setPosition({ x: boundedX, y: boundedY })
    }, [isDragging, isOpen])

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return

        setIsDragging(false)
        document.body.style.userSelect = ''

        if (!dragInfo.current.hasMoved) {
            // It was just a click, toggle menu
            setIsOpen(prev => !prev)
        } else {
            // It was a drag, snap to closest corner
            snapToCorner(position.x, position.y)
        }
    }, [isDragging, position])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const options = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ]

    const getCurrentIcon = () => {
        switch (theme) {
            case 'dark': return <Moon className="w-5 h-5 pointer-events-none" />
            case 'system': return <Monitor className="w-5 h-5 pointer-events-none" />
            case 'light':
            default: return <Sun className="w-5 h-5 pointer-events-none" />
        }
    }

    // Dynamic styling classes for tooltip position based on our snapped corner
    const getMenuLayoutClasses = () => {
        const isTop = corner.includes('top')
        const isLeft = corner.includes('left')

        // Define positioning coordinates
        let menuPosition = ""
        let animationOrigin = ""
        let flexAlign = ""

        if (isTop && isLeft) {
            menuPosition = "top-full mt-2 left-0"
            animationOrigin = "slide-in-from-top-2 origin-top-left"
            flexAlign = "items-start"
        } else if (isTop && !isLeft) {
            menuPosition = "top-full mt-2 right-0"
            animationOrigin = "slide-in-from-top-2 origin-top-right"
            flexAlign = "items-end"
        } else if (!isTop && isLeft) {
            menuPosition = "bottom-full mb-2 left-0"
            animationOrigin = "slide-in-from-bottom-2 origin-bottom-left"
            flexAlign = "items-start"
        } else { // bottom-right
            menuPosition = "bottom-full mb-2 right-0"
            animationOrigin = "slide-in-from-bottom-2 origin-bottom-right"
            flexAlign = "items-end"
        }

        return { menuPosition, animationOrigin, flexAlign }
    }

    const { menuPosition, animationOrigin, flexAlign } = getMenuLayoutClasses()

    return (
        <div
            ref={menuRef}
            className={`fixed z-50 flex flex-col ${flexAlign}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                // Make transition completely instantaneous if actively dragging to prevent lag feel, 
                // but smooth if we just finished dragging and it is snapping into place
                transition: isDragging ? 'none' : 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1), top 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            <div className="relative">
                {isOpen && (
                    <div className={`absolute ${menuPosition} animate-in fade-in ${animationOrigin} flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden p-1 min-w-[120px]`}>
                        {options.map((option) => {
                            const Icon = option.icon
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setTheme(option.value)
                                        setIsOpen(false)
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${theme === option.value
                                        ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-black dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                <button
                    ref={buttonRef}
                    onMouseDown={handleMouseDown}
                    className={`flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 shadow-lg hover:shadow-xl transition-colors ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl bg-gray-50 dark:bg-gray-800' : 'cursor-grab hover:scale-105'
                        }`}
                    aria-label="Toggle theme"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    {getCurrentIcon()}
                </button>
            </div>
        </div>
    )
}
