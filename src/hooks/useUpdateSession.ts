import { useSession } from 'next-auth/react'

export const useUpdateSession = () => {
  const { data: session, update } = useSession()

  const updateSession = async (updates: any) => {
    try {
      // Use the 'update' trigger to properly update the JWT token
      await update({
        ...updates,
        trigger: 'update'
      })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  return { session, updateSession }
}
