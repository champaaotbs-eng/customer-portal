import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './main.css'

async function main() {
    const router = getRouter()

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>,
    )
}

main()
