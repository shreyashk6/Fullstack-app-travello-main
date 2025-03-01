"use client"


import { useState, useRef, ElementRef } from "react"
import { useEventListener } from "usehooks-ts"
import { useAction } from "@/hooks/use-validated-action"
import { ListWithCards } from "@/lib/database/models/types"
import { updateList } from "@/lib/actions/list/update-list"

import { useToast } from "@/components/ui/use-toast"
import { FormInput } from "@/components/form-items/form-input"
import { ListOptions } from "./list-options"

interface ListHeaderProps {
  listData: ListWithCards
  onAddCard: () => void
}

export const ListHeader = ({
  listData,
  onAddCard,
}: ListHeaderProps) => {
  const { toast } = useToast()

  const [title, setTitle] = useState(listData.title)
  const [isEditing, setIsEditing] = useState(false)

  const formRef = useRef<ElementRef<"form">>(null)
  const inputRef = useRef<ElementRef<"input">>(null)

  const enableEditing = () => {
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const disableEditing = () => {
    setIsEditing(false)
  }

  const { execute: executeUpdateList } = useAction(updateList, {
    onSuccess: (data) => {
      toast({
        status: "success",
        title: `Itinerary "${data.title}" updated`,
      })
      setTitle(data.title)
      disableEditing()
    },
    onError: (error) => {toast({ status: "error", description: error })}
  })

  const handleSubmit = (formData: FormData) => {
    const title = formData.get("title") as string
    const id = formData.get("id") as string
    const boardId = formData.get("boardId") as string

    if (title === listData.title) {
      return disableEditing()
    }

    executeUpdateList({ title, id, boardId })
  }

  const onBlur = () => {
    formRef.current?.requestSubmit()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      formRef.current?.requestSubmit()
    }
  }

  useEventListener("keydown", onKeyDown)

  return (
    <div className="pt-2 px-2 text-sm font-semibold flex justify-between items-start- gap-x-2">
      {isEditing ? (
        <form 
          ref={formRef}
          action={handleSubmit}  
          className="flex-1 px-[2px]"
        >
          <input hidden id="id" name="id" defaultValue={listData._id} />
          <input hidden id="boardId" name="boardId" defaultValue={listData.boardId.toString()} />
          <FormInput
            ref={inputRef}
            onBlur={onBlur}
            id="title"
            placeholder="Enter list title.."
            defaultValue={title}
            className="text-sm px-[7px] py-1 h-7 font-medium border-transparent hover:border-input focus:border-input transition truncate bg-transparent focus:bg-white"
          />
          <button type="submit" hidden />
        </form>
      ) : (
        <div
          onClick={enableEditing}
          className="w-full text-sm text-teal-900 px-2.5 py-1 h-7 font-medium border-transparent"
        >
          {title}
        </div>
      )}
      <ListOptions
        onAddCard={onAddCard}
        listData={listData}
      />
    </div>
  )
}