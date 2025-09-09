import { useSession } from 'next-auth/react'

export const useUpdateSession = () => {
  const { data: session, update } = useSession()

  const updateSession = async (updates: any) => {
    try {
      await update(updates)
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  return { session, updateSession }
}
