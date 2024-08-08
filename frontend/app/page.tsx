"use client"
import useEnv from "@/lib/useEnv"
import { useState } from "react"

export default function Home() {
  const [name, setName] = useState("")
  const [body, setBody] = useState("")
  const { env } = useEnv()
  const lambdaUrl = env?.startSfnFunctionUrl as string
  const handleSubmit = async (event: any) => {
    event.preventDefault()

    try {
      const response = await fetch(lambdaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, body }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      console.log(data)
    } catch (error) {
      console.error("Error starting execution:", error)
    }
  }
  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Start Execution
          </h2>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Name:
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="body" className="block text-gray-700 mb-2">
              Body:
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Start Execution
          </button>
        </form>
      </div>
    </>
  )
}
