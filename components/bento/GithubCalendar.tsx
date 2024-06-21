'use client'

import Image from 'next/image'
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react'
import Calendar, { type Props as ActivityCalendarProps } from 'react-activity-calendar'

// Adopted from https://github.com/grubersjoe/react-github-calendar
// Copyright (c) 2019 Jonathan Gruber, MIT License

interface Props extends Omit<ActivityCalendarProps, 'data' | 'theme'> {
    username: string
}

async function fetchCalendarData(username: string): Promise<ApiResponse> {
    const response = await fetch(
        `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
    )
    const data: ApiResponse | ApiErrorResponse = await response.json()

    if (!response.ok) {
        throw Error(
            `Fetching GitHub contribution data for "${username}" failed: ${
                (data as ApiErrorResponse).error
            }`
        )
    }

    return data as ApiResponse
}
const GithubCalendar: FunctionComponent<Props> = ({ username, ...props }) => {
    const [data, setData] = useState<ApiResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchData = useCallback(() => {
        setLoading(true)
        setError(null)
        fetchCalendarData(username)
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false))
    }, [username])

    useEffect(fetchData, [fetchData])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4">
                <Image
                    src="/static/images/bento/bento-discord-futon.svg"
                    alt="Error"
                    width={0}
                    height={0}
                    className="h-auto w-24 bento-lg:w-48"
                />
                <p className="w-48 text-center text-sm text-muted-foreground bento-lg:w-64">
                    This component is down. Please email me!
                </p>
            </div>
        )
    }

    if (loading || !data) {
        return
    }

    return (
        <>
            <div className="hidden sm:block">
                <Calendar
                    data={selectLastNDays(data.contributions, 133)}
                    theme={{
                        dark: ['#1A1A1A', '#E9D3B6'],
                    }}
                    blockSize={20}
                    blockMargin={6}
                    blockRadius={7}
                    {...props}
                    // @ts-expect-error
                    maxLevel={4}
                />
            </div>
            <div className="sm:hidden">
                <Calendar
                    data={selectLastNDays(data.contributions, 60)}
                    theme={{
                        dark: ['#1A1A1A', '#E9D3B6'],
                    }}
                    blockSize={40}
                    blockMargin={10}
                    blockRadius={14}
                    {...props}
                    // @ts-expect-error
                    maxLevel={4}
                />
            </div>
        </>
    )
}

interface Activity {
    date: string
    count: number
    level: 0 | 1 | 2 | 3 | 4
}

interface ApiResponse {
    total: {
        [year: number]: number
        [year: string]: number
    }
    contributions: Array<Activity>
}

interface ApiErrorResponse {
    error: string
}

const selectLastNDays = (contributions, days) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)

    return contributions.filter((activity) => {
        const activityDate = new Date(activity.date)
        return activityDate >= startDate && activityDate <= today
    })
}

export default GithubCalendar
