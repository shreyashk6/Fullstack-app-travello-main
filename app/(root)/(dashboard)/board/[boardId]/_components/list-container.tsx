"use client"

import { useEffect, useState } from "react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { useAction } from "@/hooks/use-validated-action"
import { ListWithCards } from "@/lib/database/models/types"
import { updateListOrder } from "@/lib/actions/list/update-list-order"
import { updateCardOrder } from "@/lib/actions/card/update-card-order"

import { useToast } from "@/components/ui/use-toast"
import { ListForm } from "./list-form"
import { ListItem } from "./list-item"

interface ListContainerProps {
  data: ListWithCards[]
  boardId: string
}

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

export const ListContainer = ({
  data,
  boardId
}: ListContainerProps) => {
  const { toast } = useToast()
  const [orderedData, setOrderedData] = useState(data)

  const { execute: executeUpdateListOrder } = useAction(updateListOrder, {
    onSuccess: () => {
      toast({
        status: "success",
        title: "List reordered"
      })
    },
    onError: (error) => {toast({ status: "error", description: error })}
  })

  const { execute: executeUpdateCardOrder } = useAction(updateCardOrder, {
    onSuccess: () => {
      toast({
        status: "success",
        title: "Card reordered"
      })
    },
    onError: (error) => {toast({ status: "error", description: error })}
  })

  useEffect(() => {
    setOrderedData(data)
  }, [data])

  const onDragEnd = (result: any) => {
    const { destination, source, type } = result

    if (!destination) return

    // If moved to the same location
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Move the entire list
    if (type === "list") {
      const lists = reorder(
        orderedData,
        source.index,
        destination.index,
      ).map((list, index) => ({ ...list, order: index })) as ListWithCards[]

      setOrderedData(lists)

      const listsForUpdate = lists.map(list => ({
        _id: list._id,
        order: list.order
      }))
      executeUpdateListOrder({ lists: listsForUpdate, boardId })
    }

    // Move a single card
    if (type === "card") {
      let newOrderedData = [...orderedData]

      // Source list and destination list
      const sourceList = newOrderedData.find(list => list._id === source.droppableId)
      const destList = newOrderedData.find(list => list._id === destination.droppableId)

      if (!sourceList || !destList) {
        return
      }

      // Check if cards exist in source list
      if (!sourceList.cards) {
        sourceList.cards = []
      }

      // Check if cards exist in destination list
      if (!destList.cards) {
        destList.cards = []
      }

      // Cards are moved to the same list
      if (source.droppableId === destination.droppableId) {
        const reorderedCards = reorder(
          sourceList.cards,
          source.index,
          destination.index
        )

        // Update card order
        reorderedCards.forEach((card, idx) => {
          card.order = idx
        })

        // Update cards in source list
        sourceList.cards = reorderedCards

        setOrderedData(newOrderedData)

        const cardsForUpdate = reorderedCards.map(card => ({
          _id: card._id,
          order: card.order,
          listId: sourceList._id
        }))
        
        executeUpdateCardOrder({ cards: cardsForUpdate, boardId })

      // Card moved to another list
      } else {
        // Remove card from source list
        const [movedCard] = sourceList.cards.splice(source.index, 1)

        // Assign new listId to moved card
        movedCard.listId = destination.droppableId

        // Add card to destination list
        destList.cards.splice(destination.index, 0, movedCard)

        // Update source list card order
        sourceList.cards.forEach((card, idx) => {
          card.order = idx
        })

        // Update destination list card order
        destList.cards.forEach((card, idx) => {
          card.order = idx
        })
        
        setOrderedData(newOrderedData)

        const updatedCards = [
          ...sourceList.cards.map(card => ({
            _id: card._id,
            order: card.order,
            listId: sourceList._id // Use source list id
          })),
          ...destList.cards.map(card => ({
            _id: card._id,
            order: card.order,
            listId: destList._id, // Use destination list id
          })),
        ];
      
        executeUpdateCardOrder({ cards: updatedCards, boardId })
      }
    }
  }
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="lists" type="list" direction="horizontal">
        {(provided) => (
          <ol 
            {...provided.droppableProps}
            ref={provided.innerRef}  
            className="flex gap-x-3 h-full"
          >
            {orderedData.map((list, index) => {
              return (
                <ListItem
                  key={list._id}
                  index={index}
                  listData={list}
                />
              )
            })}
            {provided.placeholder}
            <ListForm />
            <div className="flex-shrink-0 w-1" />
          </ol>
        )}
      </Droppable>
    </DragDropContext>
  )
}