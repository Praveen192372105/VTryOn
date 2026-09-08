import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../use-auth"

export function useLogout() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear()
    },
    retry: false,
  })
}
