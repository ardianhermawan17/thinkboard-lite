"use client"

import { useWorkspaceContext } from "@shared/providers/workspace-provider"

/**
 * The people rail consumes only the shared context (a shell feature may not read the document's slice, and vice
 * versa). 043: the rail folds from the chevron beside its tabs, and this hook is the two halves of that switch.
 */
export function usePeopleRail() {
  const { peopleVisible, setPeopleVisible } = useWorkspaceContext()
  return { visible: peopleVisible, setVisible: setPeopleVisible }
}
