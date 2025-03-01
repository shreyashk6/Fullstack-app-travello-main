"use client"

import { 
  forwardRef, 
  useRef, 
  ElementRef, 
  KeyboardEventHandler,
} from "react"
import { useParams } from "next/navigation"
import { useOnClickOutside, useEventListener } from "usehooks-ts"
import { useAction } from "@/hooks/use-validated-action"
import { createCard } from "@/lib/actions/card/create-card"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { FormSubmit } from "@/components/form-items/form-submit"
import { FormTextarea } from "@/components/form-items/form-textarea"
import { Plus, X } from "lucide-react"

interface CardFormProps {
  listId: string
  enableEditing: () => void
  disableEditing: () => void
  isEditing: boolean
}

export const CardForm = forwardRef<HTMLTextAreaElement, CardFormProps>(({
  listId,
  enableEditing,
  disableEditing,
  isEditing,
}, ref) => {
  const params = useParams()
  const { toast } = useToast()

  const formRef = useRef<ElementRef<"form">>(null)

  const { execute: executeCreateCard, fieldErrors } = useAction(createCard, {
    onSuccess: (data) => {
      toast({
        status: "success",
        title: `Attractions "${data.title}" created`,
      })
      formRef.current?.reset()
    },
    onError: (error) => {toast({ status: "error", description: error })}
  })

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      disableEditing()
    }
  }

  useOnClickOutside(formRef, disableEditing)
  useEventListener("keydown", onKeyDown)

  const onTextareakeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const onSubmit = (formData: FormData) => {
    const title = formData.get("title") as string
    const listId = formData.get("listId") as string
    const boardId = params.boardId as string

    executeCreateCard({ title, listId, boardId })
  }

  if (isEditing) {
    return (
      <form
        ref={formRef}
        action={onSubmit}
        className="m-1 py-0.5 px-1 space-y-4"
      >
        <FormTextarea
          id="title"
          onKeyDown={onTextareakeyDown}
          ref={ref}
          placeholder="Enter a title for this attractions..."
          errors={fieldErrors}
        />
        <input
          hidden
          id="listId"
          name="listId"
          defaultValue={listId}
        />
        <div className="flex items-center gap-x-1">
          <FormSubmit>
            Add attraction
          </FormSubmit>
          <Button onClick={disableEditing} size="sm" variant="ghost">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="pt-2 px-2">
      <Button
        onClick={enableEditing}
        className="h-auto px-2 py-1.5 w-full justify-start text-muted-foreground text-sm"
        size="sm"
        variant="ghost"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add a attraction
      </Button>
    </div>
  )
})

CardForm.displayName = "CardForm"